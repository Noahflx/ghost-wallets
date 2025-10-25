import { ClaimWalletFlow } from "@/components/claim-wallet-flow"

interface ClaimPageProps {
  params: Promise<{
    token: string
  }>
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { token } = await params

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">G</span>
            </div>
            <span className="font-semibold text-xl">Ghost Wallets</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <ClaimWalletFlow token={token} />
      </main>
    </div>
  )
}
