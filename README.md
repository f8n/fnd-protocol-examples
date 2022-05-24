![FND Github-Examples](https://user-images.githubusercontent.com/14855515/161173632-810cdd99-e5b0-471b-b3a0-6d3b380dad6c.png)

Examples showing how you can use the @f8n/fnd-protocol npm package and integrate with [Foundation smart contracts](https://github.com/f8n/fnd-protocol).

Set up the repository with:

```
yarn
yarn build
```

## Testing

To test using a local deployment of the Foundation contracts, run:

```
yarn test
```

This uses the `test/helpers/deploy.ts` helper file to deploy Foundation contracts to your local machine for testing.

### Mainnet fork

Alternatively you can test your contracts using a [mainnet fork](https://hardhat.org/hardhat-network/guides/mainnet-forking.html#mainnet-forking). Once forked, new contract deployments and any other transactions sent happen on your local machine only. This is a great way to confirm that your contracts work as expected with the latest Foundation contracts.

First create a `.env` file (you can use `.env.example` as a template) and set the RPC endpoint. We use [Alchemy](https://www.alchemyapi.io/) but any RPC provider should work.

Then you can test with:

```
yarn test-mainnet-fork
```

This uses the `test-mainnet-fork/helpers/getFoundationContracts.ts` helper file to get Typechain instances of each of the Foundation contracts, reading the addresses from our NPM package.

We have also included helper functions such as `impersonate` to ease interacting with the fork.

## Example scripts

Some example scripts are included in the `scripts` directory to demonstrate various ways you may integrate with Foundation contracts or the data it logs on-chain. The `scripts/rpc` directory shows integrations using just an RPC endpoint such as Alchemy and the `scripts/subgraph` directory shows an alternative approach using our hosted subgraph instance.

If you have a question on how to use the Foundation contracts, please post to the [discussions](https://github.com/f8n/fnd-protocol-examples/discussions) - maybe we could create another example script to help you and others.
