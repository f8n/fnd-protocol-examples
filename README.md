# F8N-Protocol-Examples

Examples showing how you can use the @f8n/fnd-protocol npm package and integrate with [Foundation smart contracts](https://github.com/f8n/fnd-protocol).

## Testing

To test using a local deployment of the Foundation contracts, run:

```
yarn
yarn build
yarn test
```

This uses the `test/helpers/deploy.ts` helper file to deploy Foundation contracts to your local machine for testing.

### Mainnet fork

Alternatively you can test your contracts using a [mainnet fork](https://hardhat.org/hardhat-network/guides/mainnet-forking.html#mainnet-forking). Once forked, new contract deployments and any other transactions sent happen on your local machine only. This is a great way to confirm that your contracts work as expected with the latest Foundation contracts.

First create a `.env` file (you can use `.env.example` as a template) and set the RPC endpoint. We use [Alchemy](https://www.alchemyapi.io/) but any RPC provider should work.

Then you can test with:

```
yarn
yarn build
yarn test-mainnet-fork
```

This uses the `test-mainnet-fork/helpers/getContracts.ts` helper file to get Typechain instances of each of the Foundation contracts, reading the addresses from our NPM package.

We have included helper functions such as `impersonate` to ease interacting with the fork.
