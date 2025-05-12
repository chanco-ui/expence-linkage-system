import { useState } from 'react';
import Head from 'next/head';

interface SyncResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export default function Home() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/manual-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_SECRET_KEY || ''
        },
        body: JSON.stringify({ days })
      });

      const data: SyncResult = await response.json();
      setResult(data);
    } catch {
      setResult({
        success: false,
        message: '同期処理中にエラーが発生しました'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>経費連携システム</title>
        <meta name="description" content="Slack-Google Sheets経費連携システム" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">経費連携システム</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">手動同期</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              取得期間（日数）
            </label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full p-2 border rounded"
            >
              <option value={30}>30日</option>
              <option value={60}>60日</option>
              <option value={90}>90日</option>
            </select>
          </div>

          <button
            onClick={handleSync}
            disabled={loading}
            className={`w-full py-2 px-4 rounded ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? '同期中...' : '同期を開始'}
          </button>
        </div>

        {result && (
          <div
            className={`p-4 rounded ${
              result.success ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <p className="font-medium">{result.message}</p>
            {typeof result.data === 'object' && result.data !== null && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">処理結果</h3>
                <pre className="bg-gray-50 p-4 rounded overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 
