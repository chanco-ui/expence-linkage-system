import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

interface ExpenseData {
  date: string;
  content: string;
  amount: number;
  accountCode: number;
}

export class SheetsService {
  private sheets;
  private spreadsheetId: string;
  private sheetName: string;

  constructor(
    clientEmail: string,
    privateKey: string,
    spreadsheetId: string,
    sheetName: string
  ) {
    const auth = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = spreadsheetId;
    this.sheetName = sheetName;
  }

  private async ensureSheetExists(): Promise<void> {
    const sheetsMeta = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });
    const sheetExists = sheetsMeta.data.sheets?.some(
      s => s.properties?.title === this.sheetName
    );
    if (!sheetExists) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: this.sheetName,
                },
              },
            },
          ],
        },
      });
    }
  }

  // 年度（9月始まり）に基づくシート名を自動生成
  private getCurrentFiscalSheetName(): string {
    const now = new Date();
    const year = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year}年度`;
  }

  async appendExpenses(expenses: ExpenseData[]): Promise<void> {
    try {
      // 年度シート名を自動決定
      this.sheetName = this.getCurrentFiscalSheetName();
      await this.ensureSheetExists();

      // 1. 原本シートの1〜6行目（A〜AE）を取得・コピー
      const originalSheetName = process.env.ORIGINAL_SHEET_NAME!;
      const originalRowsRes = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${originalSheetName}!A1:AE6`,
      });
      const originalRows = originalRowsRes.data.values || [];
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1:AE6`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: originalRows },
      });

      // 2. 7行目以降の既存データを取得
      const existingRes = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A7:AE`,
      });
      const existingData = existingRes.data.values || [];

      // 3. その年度の9月1日以降のSlackデータのみ抽出
      const year = Number(this.sheetName.replace('年度', ''));
      const fiscalStart = new Date(`${year}-09-01`);
      const filteredExpenses = expenses.filter(e => new Date(e.date) >= fiscalStart);

      // 4. 重複していないSlackデータだけをappendで追記
      const normalizeDate = (v: unknown) => {
        const d = new Date((v || '').toString().trim());
        if (isNaN(d.getTime())) return '';
        return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
      };
      const normalizeNumber = (v: unknown) => Number((v || '').toString().replace(/[^0-9]/g, ''));
      const normalizeText = (v: unknown) => (v || '').toString().trim();

      const isDuplicate = (expense: ExpenseData) => {
        return existingData.some(rowRaw => {
          const row = [...rowRaw, ...Array(31 - rowRaw.length).fill('')];
          return (
            normalizeDate(row[0]) === normalizeDate(expense.date) &&
            normalizeNumber(row[7]) === normalizeNumber(expense.accountCode) &&
            normalizeNumber(row[14]) === normalizeNumber(expense.amount)
          );
        });
      };

      const newRows = filteredExpenses
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .filter(expense => !isDuplicate(expense))
        .map(expense => [
          expense.date, '', '', '', '', '', '',
          expense.accountCode.toString(), '', '', '', '',
          expense.content, '', expense.amount.toString(),
          ...Array(31 - 15).fill('')
        ]);

      if (newRows.length > 0) {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A7:AE`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: newRows },
        });
      }
    } catch (error) {
      console.error('Google Sheets API Error:', error);
      throw new Error('Failed to append data to Google Sheets');
    }
  }
}

