export type PaymentMode = "simulation" | "testnet"

export interface PaymentMetadata {
  mode: PaymentMode
  explorerUrl?: string
  isSimulated: boolean
}
