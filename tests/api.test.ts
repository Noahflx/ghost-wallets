import assert from "node:assert/strict"
import { before, test } from "node:test"
import fs from "node:fs/promises"
import path from "node:path"
import { NextRequest } from "next/server"

import { POST as anchorWithdraw } from "@/app/api/anchor/withdraw/route"
import { POST as claimAction } from "@/app/api/claim/actions/route"
import { generateMagicLink } from "@/lib/stellar"

const DATA_DIR = path.join(process.cwd(), "data")
const TEST_PUBLIC_KEY = "G".padEnd(56, "A")
const TEST_SECRET_KEY = "S".padEnd(56, "B")
const TEST_DESTINATION = "G".padEnd(56, "C")

async function resetDataDirectory() {
  await fs.rm(DATA_DIR, { recursive: true, force: true })
}

before(async () => {
  process.env.STELLAR_PAYMENT_MODE = "simulation"
  await resetDataDirectory()
})

function makeRequest(url: string, body: unknown): NextRequest {
  const request = new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  })

  return Object.assign(request, { ip: "127.0.0.1" }) as unknown as NextRequest
}

async function createTestMagicLink(amount = "100", currency = "USDC") {
  const link = await generateMagicLink(
    "user@example.com",
    { address: TEST_PUBLIC_KEY, secretKey: TEST_SECRET_KEY },
    amount,
    currency,
  )

  return link
}

test("anchor withdraw endpoint simulates fiat off-ramp", async () => {
  const magicLink = await createTestMagicLink("25", "USDC")

  const response = await anchorWithdraw(
    makeRequest("http://localhost/api/anchor/withdraw", {
      token: magicLink.token,
      amount: "25",
      assetCode: "USDC",
      destinationBank: "Demo Credit Union",
      referenceId: "test-ref",
    }),
  )

  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(payload.success, true)
  assert.equal(payload.simulated, true)
  assert.ok(Array.isArray(payload.logs))
})

test("claim actions owner-transfer triggers social recovery", async () => {
  const magicLink = await createTestMagicLink("50", "XLM")

  const response = await claimAction(
    makeRequest("http://localhost/api/claim/actions", {
      token: magicLink.token,
      action: "owner-transfer",
      payload: {
        newOwner: TEST_DESTINATION,
        emailClaim: "user@example.com",
      },
    }),
  )

  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(payload.success, true)
  assert.equal(typeof payload.txHash, "string")
  assert.ok(payload.txHash.length > 10)
  assert.equal(payload.simulated, true)
})
