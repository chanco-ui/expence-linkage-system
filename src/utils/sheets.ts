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

  async appendExpenses(expenses: ExpenseData[]): Promise<void> {
    try {
      // 新しいデータを7行目から一括で書き込み
      const newRows = expenses
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(expense => [
          expense.date,         // A列 (0)
          '', '', '', '', '', '', // B〜G列 (1-6)
          expense.accountCode.toString(), // H列 (7)
          '', '', '', '',      // I〜L列 (8-11)
          expense.content,     // L列 (12)
          '',                  // M列 (13)
          expense.amount.toString() // O列 (14)
        ]);

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A7:O`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: newRows,
        },
      });
    } catch (error) {
      console.error('Google Sheets API Error:', error);
      throw new Error('Failed to update data to Google Sheets');
    }
  }
}

