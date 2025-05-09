import { WebClient } from '@slack/web-api';
import { format } from 'date-fns';

interface ExpenseMessage {
  date: string;
  amount: number;
  content: string;
}

export class SlackService {
  private client: WebClient;
  private channelId: string;

  constructor(token: string, channelId: string) {
    this.client = new WebClient(token);
    this.channelId = channelId;
  }

  async fetchMessages(days: number = 30): Promise<ExpenseMessage[]> {
    const oldest = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    
    try {
      const result = await this.client.conversations.history({
        channel: this.channelId,
        oldest: oldest.toString(),
        limit: 1000
      });

      if (!result.messages) {
        return [];
      }

      return result.messages
        .filter(message => message.text && message.ts)
        .map(message => {
          const [amount, content] = message.text!.split(',').map(s => s.trim());
          return {
            date: format(new Date(Number(message.ts) * 1000), 'yyyy-MM-dd'),
            amount: Number(amount),
            content: content || ''
          };
        })
        .filter(message => !isNaN(message.amount));
    } catch (error) {
      console.error('Slack API Error:', error);
      throw new Error('Failed to fetch messages from Slack');
    }
  }
} 