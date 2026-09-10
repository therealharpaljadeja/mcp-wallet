import type { Database } from "@mcp-wallet/db";
import { MONAD_TESTNET } from "@mcp-wallet/shared";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { DynamicIdentity } from "./dynamic-auth.js";
import type { Environment } from "./env.js";
import { getBearerToken } from "./http.js";
import { upsertIdentity } from "./identity.js";
import { getMonadBalance } from "./transfer.js";

const walletQuerySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export async function registerWalletRoutes(
  app: FastifyInstance,
  dependencies: {
    db: Database;
    environment: Environment;
    verifyDynamicToken: (
      token: string,
      submittedWalletAddress?: string,
    ) => Promise<DynamicIdentity>;
  },
) {
  const { db, environment, verifyDynamicToken } = dependencies;

  app.get("/api/wallet", async (request, reply) => {
    const token = getBearerToken(request);
    const query = walletQuerySchema.safeParse(request.query);
    if (!token || !query.success) {
      return reply.code(400).send({ error: "invalid_request" });
    }

    let identity: DynamicIdentity;
    try {
      identity = await verifyDynamicToken(token, query.data.address);
    } catch (error) {
      request.log.warn({ err: error }, "Dynamic wallet lookup failed");
      return reply.code(401).send({ error: "invalid_dynamic_session" });
    }

    const { wallet } = await upsertIdentity(db, identity);
    try {
      const balance = await getMonadBalance(environment.MONAD_RPC_URL, wallet.address);
      return {
        wallet: {
          address: wallet.address,
          chain: wallet.chain,
          network: MONAD_TESTNET.name,
          chain_id: MONAD_TESTNET.id,
        },
        assets: [
          {
            type: "native",
            name: MONAD_TESTNET.nativeCurrency.name,
            symbol: MONAD_TESTNET.nativeCurrency.symbol,
            decimals: MONAD_TESTNET.nativeCurrency.decimals,
            amount: balance.amount,
            amount_wei: balance.amountWei,
          },
        ],
      };
    } catch (error) {
      request.log.warn({ err: error }, "Monad balance lookup failed");
      return reply.code(502).send({ error: "balance_lookup_failed" });
    }
  });
}
