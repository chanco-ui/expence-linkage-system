import { NextApiRequest, NextApiResponse } from 'next';
import { SlackService } from '../../utils/slack';
import { SheetsService } from '../../utils/sheets';
import { findAccountCode } from '../../utils/account-code-matcher';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // APIキーの認証
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { days = 30 } = req.body;
    const slackService = new SlackService(
      process.env.SLACK_TOKEN!,
      process.env.SLACK_CHANNEL_ID!
    );

    // ここでprivateKeyを復元
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    const sheetsService = new SheetsService(
      process.env.GOOGLE_CLIENT_EMAIL!,
      privateKey!,
      process.env.SPREADSHEET_ID!,
      process.env.SHEET_NAME!
    );

    // Slackからメッセージを取得
    const messages = await slackService.fetchMessages(days);

    // 科目コードを判定してデータを整形
    const expenses = messages.map(message => ({
      date: message.date,
      content: message.content,
      amount: message.amount,
      accountCode: findAccountCode(message.content)
    }));

    // Google Sheetsにデータを追加
    await sheetsService.appendExpenses(expenses);

    res.status(200).json({
      success: true,
      message: `Successfully processed ${expenses.length} expenses`,
      data: expenses
    });
  } catch (error) {
    console.error('Manual Sync Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync expenses'
    });
  }
} 