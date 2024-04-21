export enum AccountType {
  Vendor = 'Vendor',
  Client = 'Client',
}

export enum BusinessType {
  Operator = 'Operator',
  Hub = 'Hub',
  Enterprise = 'Enterprise',
  OTT = 'OTT',
  Testing = 'Testing',
}

export enum AccountCategory {
  Direct = 'Direct',
  Wholesale = 'Wholesale',
  HighQuality = 'HighQuality',
  SimBox = 'SimBox',
  Special = 'Special',
  Test = 'Test',
}

export enum AccountMode {
  SMPP = 'SMPP',
  SS7 = 'SS7',
  Http = 'Http',
}

export enum AccountStatus {
  Active = 'Active',
  Inactive = 'Inactive',
}

export enum ConnectionMode {
  Transceiver = 'Transceiver',
  Receiver = 'Receiver',
  Transmitter = 'Transmitter',
}

export enum FileFormat {
  CSV = 'text/csv',
  XLS = 'application/vnd.ms-excel',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}
