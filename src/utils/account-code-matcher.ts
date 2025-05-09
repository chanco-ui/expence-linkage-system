interface AccountCodeMapping {
  code: number;
  keywords: string[];
}

const accountCodeMappings: AccountCodeMapping[] = [
  { code: 350, keywords: ['役員借入', '役員貸付', '役員融資'] },
  { code: 316, keywords: ['源泉', '源泉所得税'] },
  { code: 317, keywords: ['市県民税', '住民税'] },
  { code: 716, keywords: ['法定福利', '社会保険', '厚生年金'] },
  { code: 717, keywords: ['福利厚生', '社員旅行', '忘年会', '新年会'] },
  { code: 718, keywords: ['広告', '宣伝', 'PR', 'マーケティング'] },
  { code: 722, keywords: ['交通費', 'タクシー', '電車', 'バス', '飛行機', '新幹線', 'ガソリン'] },
  { code: 727, keywords: ['交際費', '接待', '飲食'] },
  { code: 737, keywords: ['会議', '打ち合わせ', 'ミーティング', '面談'] },
  { code: 723, keywords: ['燃料', 'ガソリン', '軽油'] },
  { code: 724, keywords: ['通信', '電話', 'インターネット', 'WiFi', '回線', '通話'] },
  { code: 725, keywords: ['水道', '電気', 'ガス', '光熱費'] },
  { code: 726, keywords: ['税金', '租税', '公課'] },
  { code: 728, keywords: ['消耗品', '文具'] },
  { code: 729, keywords: ['事務用品', 'オフィス用品'] },
  { code: 738, keywords: ['リース', 'レンタル'] },
  { code: 732, keywords: ['修繕', '修理', 'メンテナンス'] },
  { code: 733, keywords: ['保険', '損害保険', '生命保険'] },
  { code: 734, keywords: ['手数料', '振込手数料', 'ATM手数料'] },
  { code: 739, keywords: ['会費', '組合費', '協会費'] },
  { code: 741, keywords: ['新聞', '図書', '書籍', '雑誌'] },
  { code: 743, keywords: ['報酬', '手当', '給与'] },
  { code: 744, keywords: ['家賃', '地代', '賃貸'] },
  { code: 745, keywords: ['雑費', 'その他'] }
];

export function findAccountCode(content: string): number {
  const normalizedContent = content.toLowerCase().trim();
  
  // 完全一致を探す
  for (const mapping of accountCodeMappings) {
    if (mapping.keywords.some(keyword => normalizedContent === keyword.toLowerCase())) {
      return mapping.code;
    }
  }
  
  // 部分一致を探す
  for (const mapping of accountCodeMappings) {
    if (mapping.keywords.some(keyword => normalizedContent.includes(keyword.toLowerCase()))) {
      return mapping.code;
    }
  }
  
  // デフォルトは雑費
  return 745;
} 