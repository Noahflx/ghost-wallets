export type PaymentMode = "simulation" | "testnet" | "sandbox"

export type AssetType = "native" | "credit-alphanum4" | "credit-alphanum12"

export interface PaymentMetadata {
  mode: PaymentMode
  explorerUrl?: string
  isSimulated: boolean
  assetCode: string
  assetType: AssetType
  assetIssuer?: string
}
