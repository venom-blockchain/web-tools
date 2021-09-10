import React, { useEffect, useState } from 'react';
import ton, {
  Permissions,
  Subscriber,
  ContractState,
  Address,
  Transaction,
  mergeTransactions,
  TransactionsBatchInfo,
  TransactionId,
  serializeTransaction,
  parseTokensObject
} from 'ton-inpage-provider';
import { Mutex } from '@broxus/await-semaphore';
import { SideBar } from './SideBar';
import { Executor, ParsedAbi } from './Executor';

type ExecutorWorkspaceProps = {
  hasTonProvider: boolean;
  walletAccount?: Permissions['accountInteraction'];
};

const accountMutex: Mutex = new Mutex();
let accountSubscriber: Subscriber | undefined = undefined;
let accountTransactions: Transaction[] = [];

export const ExecutorWorkspace: React.FC<ExecutorWorkspaceProps> = ({ hasTonProvider, walletAccount }) => {
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [accountAddress, setAccountAddress] = useState<string>();
  const [accountState, setAccountState] = useState<ContractState>();
  const [transactionCount, setTransactionCount] = useState<number>(0);
  const [version, setVersion] = useState(0);
  const [abi, setAbi] = useState<ParsedAbi>();

  const invalidateComponents = () => {
    setVersion(version + 1);
  };

  const handleTransactions = ({ transactions, info }: { transactions: Transaction[]; info: TransactionsBatchInfo }) => {
    if (transactions.length == 0) {
      return;
    }
    mergeTransactions(accountTransactions, transactions, info);
    setTransactionCount(accountTransactions.length);
  };

  const preloadTransactions = async (continuation: TransactionId) => {
    if (accountAddress == null) {
      return;
    }

    setInProgress(true);

    accountMutex
      .use(async () => {
        setInProgress(true);
        const address = new Address(accountAddress);

        const { transactions, info } = await ton.getTransactions({
          address,
          continuation
        });

        if (info == null) {
          return;
        }
        handleTransactions({ transactions, info });
      })
      .finally(() => {
        setInProgress(false);
      });
  };

  useEffect(() => {
    if (abi == null || transactionCount == 0) {
      return;
    }

    accountMutex
      .use(async () => {
        await Promise.all(
          accountTransactions.map(async transaction => {
            try {
              const functionData = await ton.rawApi.decodeTransaction({
                abi: abi.abi,
                transaction: serializeTransaction(transaction),
                method: abi.functionNames
              });
              if (functionData != null) {
                const f = abi.functions[functionData.method] as ParsedAbi['functions'][string] | undefined;
                (transaction as any).parsedFunctionData = {
                  method: functionData.method,
                  input: f != null ? parseTokensObject(f.inputs, functionData.input) : undefined,
                  output: f != null ? parseTokensObject(f.outputs, functionData.output) : undefined
                };
              } else {
                (transaction as any).parsedFunctionData = undefined;
              }

              const { events } = await ton.rawApi.decodeTransactionEvents({
                abi: abi.abi,
                transaction: serializeTransaction(transaction)
              });
              const parsedEvents = events.map(item => {
                const f = abi.events[item.event] as ParsedAbi['events'][string] | undefined;
                return {
                  event: item.event,
                  input: f != null ? parseTokensObject(f.inputs, item.data) : undefined
                };
              });

              (transaction as any).parsedEventsData = parsedEvents.length > 0 ? parsedEvents : undefined;
            } catch (e) {}
          })
        );
        invalidateComponents();
      })
      .catch(console.error);
  }, [abi?.abi, transactionCount]);

  useEffect(() => {
    if (accountAddress == null) {
      return;
    }

    setInProgress(true);

    accountMutex
      .use(async () => {
        setInProgress(true);
        const address = new Address(accountAddress);

        accountSubscriber = ton.createSubscriber();
        const { state } = await ton.getFullContractState({
          address
        });

        setAccountState(state);
        accountSubscriber.states(address).on(({ state }) => {
          setAccountState(state);
        });

        if (state?.lastTransactionId != null) {
          const { transactions, info } = await ton.getTransactions({
            address,
            continuation: {
              lt: state.lastTransactionId.lt,
              hash: state.lastTransactionId.hash || '00'.repeat(32)
            }
          });
          if (info != null) {
            handleTransactions({ transactions, info });
          }
        }

        accountSubscriber.transactions(address).on(handleTransactions);
      })
      .catch(console.error)
      .finally(() => {
        setInProgress(false);
      });

    return () => {
      accountMutex
        .use(async () => {
          await accountSubscriber?.unsubscribe();
          setAccountState(undefined);
          accountTransactions = [];
          setTransactionCount(0);
        })
        .catch(console.error);
    };
  }, [accountAddress]);

  if (!hasTonProvider || walletAccount == null) {
    return (
      <section className="hero is-fullheight-with-navbar">
        <div className="hero-body is-justify-content-center">
          <div className="">
            <p className="title">{!hasTonProvider ? 'Wallet not installed' : 'Wallet not connected'}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container is-fluid">
        <div className="columns">
          <div className="column is-4">
            <SideBar
              version={version}
              inProgress={inProgress}
              address={accountAddress}
              state={accountState}
              transactions={accountTransactions}
              transactionCount={transactionCount}
              onChangeAddress={setAccountAddress}
              onPreloadTransactions={preloadTransactions}
            />
          </div>
          <div className="column is-8">
            {accountState != null && (
              <Executor
                wallet={walletAccount}
                version={version}
                inProgress={inProgress}
                address={accountAddress}
                state={accountState}
                abi={abi}
                onChangeAbi={newAbi => {
                  setAbi(prevAbi => {
                    if (prevAbi != null) {
                      for (const item of prevAbi.functionHandlers) {
                        item.handler.free();
                      }
                      prevAbi.functionHandlers.splice(0, prevAbi.functionHandlers.length);
                    }
                    return newAbi;
                  });
                }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
