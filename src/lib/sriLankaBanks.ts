/**
 * Sri Lankan Bank, Branch & Branch Code Master Directory
 * Used for automated branch cascading and instant branch code auto-filling.
 */

export interface BankBranch {
  branchName: string;
  branchCode: string;
  district: string;
}

export interface BankInfo {
  id: string;
  bankName: string;
  bankCode: string;
  branches: BankBranch[];
}

export const SRI_LANKA_BANKS: BankInfo[] = [
  {
    id: 'boc',
    bankName: 'Bank of Ceylon (BOC)',
    bankCode: '7010',
    branches: [
      { branchName: 'Jaffna Main Branch', branchCode: '045', district: 'Jaffna' },
      { branchName: 'Nallur Branch', branchCode: '212', district: 'Jaffna' },
      { branchName: 'Chunnakam Branch', branchCode: '118', district: 'Jaffna' },
      { branchName: 'Chavakachcheri Branch', branchCode: '092', district: 'Jaffna' },
      { branchName: 'Point Pedro Branch', branchCode: '304', district: 'Jaffna' },
      { branchName: 'Manipay Branch', branchCode: '195', district: 'Jaffna' },
      { branchName: 'Kilinochchi Branch', branchCode: '156', district: 'Kilinochchi' },
      { branchName: 'Vavuniya Main Branch', branchCode: '382', district: 'Vavuniya' },
      { branchName: 'Mannar Branch', branchCode: '201', district: 'Mannar' },
      { branchName: 'Mullaitivu Branch', branchCode: '241', district: 'Mullaitivu' },
      { branchName: 'Batticaloa Main Branch', branchCode: '062', district: 'Batticaloa' },
      { branchName: 'Trincomalee Main Branch', branchCode: '365', district: 'Trincomalee' },
      { branchName: 'Kalmunai Branch', branchCode: '142', district: 'Ampara' },
      { branchName: 'Colombo Fort Main Branch', branchCode: '001', district: 'Colombo' },
      { branchName: 'Kandy Main Branch', branchCode: '148', district: 'Kandy' },
    ],
  },
  {
    id: 'combank',
    bankName: 'Commercial Bank of Ceylon',
    bankCode: '7056',
    branches: [
      { branchName: 'Jaffna Main Branch', branchCode: '045', district: 'Jaffna' },
      { branchName: 'Stanley Road Jaffna Branch', branchCode: '182', district: 'Jaffna' },
      { branchName: 'Chunnakam Branch', branchCode: '118', district: 'Jaffna' },
      { branchName: 'Chavakachcheri Branch', branchCode: '092', district: 'Jaffna' },
      { branchName: 'Manipay Branch', branchCode: '195', district: 'Jaffna' },
      { branchName: 'Point Pedro Branch', branchCode: '304', district: 'Jaffna' },
      { branchName: 'Nelliady Branch', branchCode: '220', district: 'Jaffna' },
      { branchName: 'Kilinochchi Branch', branchCode: '156', district: 'Kilinochchi' },
      { branchName: 'Vavuniya Branch', branchCode: '382', district: 'Vavuniya' },
      { branchName: 'Mannar Branch', branchCode: '201', district: 'Mannar' },
      { branchName: 'Batticaloa Branch', branchCode: '062', district: 'Batticaloa' },
      { branchName: 'Trincomalee Branch', branchCode: '365', district: 'Trincomalee' },
      { branchName: 'Colombo Foreign Branch', branchCode: '001', district: 'Colombo' },
      { branchName: 'Kandy Branch', branchCode: '148', district: 'Kandy' },
    ],
  },
  {
    id: 'peoples',
    bankName: "People's Bank",
    bankCode: '7135',
    branches: [
      { branchName: 'Jaffna Main Branch', branchCode: '045', district: 'Jaffna' },
      { branchName: 'Nallur Branch', branchCode: '212', district: 'Jaffna' },
      { branchName: 'Chunnakam Branch', branchCode: '118', district: 'Jaffna' },
      { branchName: 'Chavakachcheri Branch', branchCode: '092', district: 'Jaffna' },
      { branchName: 'Point Pedro Branch', branchCode: '304', district: 'Jaffna' },
      { branchName: 'Kilinochchi Branch', branchCode: '156', district: 'Kilinochchi' },
      { branchName: 'Vavuniya Branch', branchCode: '382', district: 'Vavuniya' },
      { branchName: 'Mannar Branch', branchCode: '201', district: 'Mannar' },
      { branchName: 'Mullaitivu Branch', branchCode: '241', district: 'Mullaitivu' },
      { branchName: 'Batticaloa Branch', branchCode: '062', district: 'Batticaloa' },
      { branchName: 'Trincomalee Branch', branchCode: '365', district: 'Trincomalee' },
      { branchName: 'Colombo Corporate Branch', branchCode: '001', district: 'Colombo' },
      { branchName: 'Kandy Branch', branchCode: '148', district: 'Kandy' },
    ],
  },
  {
    id: 'hnb',
    bankName: 'Hatton National Bank (HNB)',
    bankCode: '7083',
    branches: [
      { branchName: 'Jaffna Main Branch', branchCode: '045', district: 'Jaffna' },
      { branchName: 'Chunnakam Branch', branchCode: '118', district: 'Jaffna' },
      { branchName: 'Chavakachcheri Branch', branchCode: '092', district: 'Jaffna' },
      { branchName: 'Nelliady Branch', branchCode: '220', district: 'Jaffna' },
      { branchName: 'Manipay Branch', branchCode: '195', district: 'Jaffna' },
      { branchName: 'Kilinochchi Branch', branchCode: '156', district: 'Kilinochchi' },
      { branchName: 'Vavuniya Branch', branchCode: '382', district: 'Vavuniya' },
      { branchName: 'Mannar Branch', branchCode: '201', district: 'Mannar' },
      { branchName: 'Batticaloa Branch', branchCode: '062', district: 'Batticaloa' },
      { branchName: 'Trincomalee Branch', branchCode: '365', district: 'Trincomalee' },
      { branchName: 'Colombo City Office', branchCode: '001', district: 'Colombo' },
      { branchName: 'Kandy Branch', branchCode: '148', district: 'Kandy' },
    ],
  },
  {
    id: 'sampath',
    bankName: 'Sampath Bank',
    bankCode: '7278',
    branches: [
      { branchName: 'Jaffna Branch', branchCode: '045', district: 'Jaffna' },
      { branchName: 'Chunnakam Branch', branchCode: '118', district: 'Jaffna' },
      { branchName: 'Chavakachcheri Branch', branchCode: '092', district: 'Jaffna' },
      { branchName: 'Kilinochchi Branch', branchCode: '156', district: 'Kilinochchi' },
      { branchName: 'Vavuniya Branch', branchCode: '382', district: 'Vavuniya' },
      { branchName: 'Mannar Branch', branchCode: '201', district: 'Mannar' },
      { branchName: 'Batticaloa Branch', branchCode: '062', district: 'Batticaloa' },
      { branchName: 'Trincomalee Branch', branchCode: '365', district: 'Trincomalee' },
      { branchName: 'Colombo Head Office Branch', branchCode: '001', district: 'Colombo' },
      { branchName: 'Kandy Branch', branchCode: '148', district: 'Kandy' },
    ],
  },
  {
    id: 'seylan',
    bankName: 'Seylan Bank',
    bankCode: '7287',
    branches: [
      { branchName: 'Jaffna Main Branch', branchCode: '045', district: 'Jaffna' },
      { branchName: 'Chunnakam Branch', branchCode: '118', district: 'Jaffna' },
      { branchName: 'Chavakachcheri Branch', branchCode: '092', district: 'Jaffna' },
      { branchName: 'Nelliady Branch', branchCode: '220', district: 'Jaffna' },
      { branchName: 'Kilinochchi Branch', branchCode: '156', district: 'Kilinochchi' },
      { branchName: 'Vavuniya Branch', branchCode: '382', district: 'Vavuniya' },
      { branchName: 'Batticaloa Branch', branchCode: '062', district: 'Batticaloa' },
      { branchName: 'Trincomalee Branch', branchCode: '365', district: 'Trincomalee' },
      { branchName: 'Colombo Fort Branch', branchCode: '001', district: 'Colombo' },
    ],
  },
  {
    id: 'nsb',
    bankName: 'National Savings Bank (NSB)',
    bankCode: '7719',
    branches: [
      { branchName: 'Jaffna Main Branch', branchCode: '045', district: 'Jaffna' },
      { branchName: 'Chunnakam Branch', branchCode: '118', district: 'Jaffna' },
      { branchName: 'Chavakachcheri Branch', branchCode: '092', district: 'Jaffna' },
      { branchName: 'Point Pedro Branch', branchCode: '304', district: 'Jaffna' },
      { branchName: 'Kilinochchi Branch', branchCode: '156', district: 'Kilinochchi' },
      { branchName: 'Vavuniya Branch', branchCode: '382', district: 'Vavuniya' },
      { branchName: 'Mannar Branch', branchCode: '201', district: 'Mannar' },
      { branchName: 'Batticaloa Branch', branchCode: '062', district: 'Batticaloa' },
      { branchName: 'Trincomalee Branch', branchCode: '365', district: 'Trincomalee' },
      { branchName: 'Colombo Main Branch', branchCode: '001', district: 'Colombo' },
    ],
  },
  {
    id: 'ntb',
    bankName: 'Nations Trust Bank (NTB)',
    bankCode: '7162',
    branches: [
      { branchName: 'Jaffna Branch', branchCode: '045', district: 'Jaffna' },
      { branchName: 'Vavuniya Branch', branchCode: '382', district: 'Vavuniya' },
      { branchName: 'Batticaloa Branch', branchCode: '062', district: 'Batticaloa' },
      { branchName: 'Colombo Main Branch', branchCode: '001', district: 'Colombo' },
      { branchName: 'Kandy Branch', branchCode: '148', district: 'Kandy' },
    ],
  },
  {
    id: 'dfcc',
    bankName: 'DFCC Bank',
    bankCode: '7465',
    branches: [
      { branchName: 'Jaffna Branch', branchCode: '045', district: 'Jaffna' },
      { branchName: 'Chunnakam Branch', branchCode: '118', district: 'Jaffna' },
      { branchName: 'Kilinochchi Branch', branchCode: '156', district: 'Kilinochchi' },
      { branchName: 'Vavuniya Branch', branchCode: '382', district: 'Vavuniya' },
      { branchName: 'Batticaloa Branch', branchCode: '062', district: 'Batticaloa' },
      { branchName: 'Colombo Fort Branch', branchCode: '001', district: 'Colombo' },
    ],
  },
  {
    id: 'panasia',
    bankName: 'Pan Asia Bank',
    bankCode: '7302',
    branches: [
      { branchName: 'World Trade Center', branchCode: '1', district: 'Colombo' },
      { branchName: 'Jaffna Branch', branchCode: '045', district: 'Jaffna' },
      { branchName: 'Chunnakam Branch', branchCode: '118', district: 'Jaffna' },
      { branchName: 'Kilinochchi Branch', branchCode: '156', district: 'Kilinochchi' },
      { branchName: 'Vavuniya Branch', branchCode: '382', district: 'Vavuniya' },
      { branchName: 'Colombo Central Branch', branchCode: '001', district: 'Colombo' },
    ],
  },
  {
    id: 'amana',
    bankName: 'Amana Bank',
    bankCode: '7474',
    branches: [
      { branchName: 'Jaffna Branch', branchCode: '045', district: 'Jaffna' },
      { branchName: 'Batticaloa Branch', branchCode: '062', district: 'Batticaloa' },
      { branchName: 'Kattankudy Branch', branchCode: '080', district: 'Batticaloa' },
      { branchName: 'Colombo Main Branch', branchCode: '001', district: 'Colombo' },
    ],
  },
  {
    id: 'cargills',
    bankName: 'Cargills Bank',
    bankCode: '7483',
    branches: [
      { branchName: 'Jaffna Branch', branchCode: '045', district: 'Jaffna' },
      { branchName: 'Chunnakam Branch', branchCode: '118', district: 'Jaffna' },
      { branchName: 'Vavuniya Branch', branchCode: '382', district: 'Vavuniya' },
      { branchName: 'Colombo Head Office', branchCode: '001', district: 'Colombo' },
    ],
  },
];

export const getBankByName = (name: string): BankInfo | undefined => {
  return SRI_LANKA_BANKS.find(
    (b) =>
      b.bankName.toLowerCase() === name.toLowerCase() ||
      b.bankName.toLowerCase().includes(name.toLowerCase())
  );
};

export const getBranchInfo = (
  bankName: string,
  branchName: string
): BankBranch | undefined => {
  const bank = getBankByName(bankName);
  if (!bank) return undefined;
  return bank.branches.find(
    (br) =>
      br.branchName.toLowerCase() === branchName.toLowerCase() ||
      br.branchName.toLowerCase().includes(branchName.toLowerCase())
  );
};
