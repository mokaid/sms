export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
}

export enum ClassificationLevel {
  A = 'A',
  B = 'B',
  C = 'C',
}

export enum PaymentType {
  Prepaid = 'Prepaid',
  Postpaid = 'Postpaid',
}

export enum InvoiceTemplate {
  EuroWithoutVAT = 'EuroWithoutVAT',
  EuroWithVAT = 'EuroWithVAT',
  USDWithoutVAT = 'USDWithoutVAT',
  USDWithVAT = 'USDWithVAT',
  Default = 'Default',
}

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
