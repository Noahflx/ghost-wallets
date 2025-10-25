export type PaymentMode = "simulation" | "testnet" | "sandbox"

export interface PaymentMetadata {
  mode: PaymentMode
  explorerUrl?: string
  isSimulated: boolean
}
