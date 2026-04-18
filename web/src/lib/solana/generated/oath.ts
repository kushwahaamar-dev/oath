/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/oath.json`.
 */
export type Oath = {
  "address": "2Uvqbnt6kiaB7Y3AHhtS2FLWRFrJweRebtErSQE2kPmy",
  "metadata": {
    "name": "oath",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createOath",
      "docs": [
        "Create a new oath. Both the user and the agent must sign. The",
        "agent's `stake_amount` lamports are transferred into a",
        "system-owned PDA vault that this program can only drain via",
        "`revoke_oath`, `slash`, `fulfill_oath`, or `expire_oath`."
      ],
      "discriminator": [
        18,
        53,
        143,
        138,
        106,
        66,
        255,
        195
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "agent",
          "writable": true,
          "signer": true
        },
        {
          "name": "oath",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  97,
                  116,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "agent"
              },
              {
                "kind": "arg",
                "path": "args.oath_id"
              }
            ]
          }
        },
        {
          "name": "stakeVault",
          "docs": [
            "We validate the derivation via `seeds` + `bump`; no data lives",
            "here."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "oath"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "createOathArgs"
            }
          }
        }
      ]
    },
    {
      "name": "expireOath",
      "docs": [
        "Anyone can call `expire_oath` after the expiry timestamp has",
        "passed. Returns stake minus an optional keeper fee to the",
        "agent."
      ],
      "discriminator": [
        229,
        207,
        133,
        102,
        85,
        31,
        242,
        161
      ],
      "accounts": [
        {
          "name": "keeper",
          "writable": true,
          "signer": true
        },
        {
          "name": "oath",
          "writable": true
        },
        {
          "name": "agent",
          "writable": true,
          "relations": [
            "oath"
          ]
        },
        {
          "name": "stakeVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "oath"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "fulfillOath",
      "docs": [
        "User-initiated happy-path close. Stake returns to agent."
      ],
      "discriminator": [
        182,
        44,
        204,
        190,
        123,
        246,
        104,
        14
      ],
      "accounts": [
        {
          "name": "user",
          "signer": true,
          "relations": [
            "oath"
          ]
        },
        {
          "name": "oath",
          "writable": true
        },
        {
          "name": "agent",
          "writable": true,
          "relations": [
            "oath"
          ]
        },
        {
          "name": "stakeVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "oath"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "recordAction",
      "docs": [
        "Pre-commit an intended agent action. Reverts if the action is",
        "out of scope, over cap, or the oath is not active. Backend",
        "verifiers refuse to serve agents whose most recent",
        "`record_action` reverted."
      ],
      "discriminator": [
        153,
        153,
        235,
        171,
        52,
        54,
        196,
        145
      ],
      "accounts": [
        {
          "name": "agent",
          "signer": true,
          "relations": [
            "oath"
          ]
        },
        {
          "name": "oath",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "recordActionArgs"
            }
          }
        }
      ]
    },
    {
      "name": "revokeOath",
      "docs": [
        "User-initiated revocation. Status → Revoked and stake is",
        "returned to the agent. No fee in v1."
      ],
      "discriminator": [
        29,
        115,
        17,
        59,
        16,
        58,
        93,
        242
      ],
      "accounts": [
        {
          "name": "user",
          "signer": true,
          "relations": [
            "oath"
          ]
        },
        {
          "name": "oath",
          "writable": true
        },
        {
          "name": "agent",
          "docs": [
            "`has_one = agent` on the oath account."
          ],
          "writable": true,
          "relations": [
            "oath"
          ]
        },
        {
          "name": "stakeVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "oath"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "slash",
      "docs": [
        "Anyone can call `slash` once an oracle-signed Ed25519 proof of",
        "a scope-violating action is available. Moves the full vault to",
        "the user and terminates the oath."
      ],
      "discriminator": [
        204,
        141,
        18,
        161,
        8,
        177,
        92,
        142
      ],
      "accounts": [
        {
          "name": "slasher",
          "writable": true,
          "signer": true
        },
        {
          "name": "oath",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "relations": [
            "oath"
          ]
        },
        {
          "name": "stakeVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "oath"
              }
            ]
          }
        },
        {
          "name": "instructionsSysvar",
          "docs": [
            "caller cannot substitute a crafted account."
          ],
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "slashArgs"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "oath",
      "discriminator": [
        222,
        97,
        48,
        50,
        185,
        60,
        175,
        24
      ]
    }
  ],
  "events": [
    {
      "name": "actionRecorded",
      "discriminator": [
        115,
        16,
        23,
        116,
        227,
        176,
        247,
        96
      ]
    },
    {
      "name": "actionRejected",
      "discriminator": [
        3,
        35,
        59,
        10,
        118,
        29,
        59,
        83
      ]
    },
    {
      "name": "oathCreated",
      "discriminator": [
        165,
        157,
        51,
        209,
        94,
        123,
        115,
        117
      ]
    },
    {
      "name": "oathExpiredEvent",
      "discriminator": [
        121,
        199,
        165,
        199,
        54,
        234,
        188,
        46
      ]
    },
    {
      "name": "oathFulfilled",
      "discriminator": [
        207,
        19,
        109,
        61,
        88,
        183,
        131,
        232
      ]
    },
    {
      "name": "oathRevoked",
      "discriminator": [
        192,
        8,
        224,
        244,
        77,
        60,
        6,
        159
      ]
    },
    {
      "name": "oathSlashed",
      "discriminator": [
        23,
        151,
        200,
        36,
        91,
        63,
        52,
        44
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorizedActionType",
      "msg": "Action type is not in this oath's allowed list."
    },
    {
      "code": 6001,
      "name": "recipientNotAllowed",
      "msg": "Recipient is not in this oath's whitelist."
    },
    {
      "code": 6002,
      "name": "perTxCapExceeded",
      "msg": "Requested amount exceeds the per-transaction cap."
    },
    {
      "code": 6003,
      "name": "spendCapExceeded",
      "msg": "Cumulative spend would exceed this oath's spend cap."
    },
    {
      "code": 6004,
      "name": "oathExpired",
      "msg": "Oath has expired."
    },
    {
      "code": 6005,
      "name": "oathNotActive",
      "msg": "Oath is not active."
    },
    {
      "code": 6006,
      "name": "oathNotExpired",
      "msg": "Oath has not yet expired."
    },
    {
      "code": 6007,
      "name": "zeroStake",
      "msg": "Stake amount must be greater than zero."
    },
    {
      "code": 6008,
      "name": "invalidCaps",
      "msg": "Per-tx cap cannot exceed spend cap."
    },
    {
      "code": 6009,
      "name": "expiryInPast",
      "msg": "Expiry must be in the future."
    },
    {
      "code": 6010,
      "name": "tooManyActionTypes",
      "msg": "Too many allowed action types (max 8)."
    },
    {
      "code": 6011,
      "name": "tooManyRecipients",
      "msg": "Too many allowed recipients (max 16)."
    },
    {
      "code": 6012,
      "name": "purposeUriTooLong",
      "msg": "Purpose URI exceeds maximum length."
    },
    {
      "code": 6013,
      "name": "invalidSlashProof",
      "msg": "Slash proof is invalid or not signed by the oracle."
    },
    {
      "code": 6014,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow."
    }
  ],
  "types": [
    {
      "name": "actionRecorded",
      "docs": [
        "Emitted on every successful `record_action`. Backend indexers feed",
        "MongoDB from this event stream; the `seq` equals the post-increment",
        "`action_count` so consumers can de-dupe."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oath",
            "type": "pubkey"
          },
          {
            "name": "seq",
            "type": "u32"
          },
          {
            "name": "actionType",
            "type": {
              "defined": {
                "name": "actionType"
              }
            }
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "spentAfter",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "actionRejected",
      "docs": [
        "Emitted when the program rejects a `record_action` attempt. We",
        "still want observability even though the instruction reverts, so",
        "the backend's `logs_subscribe` also captures this via the error",
        "variant. This event is purely for off-chain indexing of *successful*",
        "rejections that were caught before the revert.",
        "",
        "Note: Anchor reverts clear state changes, so this event is only",
        "emitted from instructions that explicitly log before returning Err."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oath",
            "type": "pubkey"
          },
          {
            "name": "actionType",
            "type": {
              "defined": {
                "name": "actionType"
              }
            }
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "reason",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "actionType",
      "docs": [
        "Categories of action an agent can take. The on-chain allowlist is",
        "expressed as a `Vec<ActionType>` that must be a subset of this enum."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "payment"
          },
          {
            "name": "dataRead"
          },
          {
            "name": "apiCall"
          },
          {
            "name": "tokenTransfer"
          },
          {
            "name": "signature"
          },
          {
            "name": "multimodalInput"
          }
        ]
      }
    },
    {
      "name": "createOathArgs",
      "docs": [
        "Arguments for `create_oath`, packaged into a struct so instruction",
        "introspection (and the generated IDL) stays clean."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oathId",
            "type": "u64"
          },
          {
            "name": "purposeHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "purposeUri",
            "type": "string"
          },
          {
            "name": "spendCap",
            "type": "u64"
          },
          {
            "name": "perTxCap",
            "type": "u64"
          },
          {
            "name": "stakeAmount",
            "type": "u64"
          },
          {
            "name": "allowedActionTypes",
            "type": {
              "vec": {
                "defined": {
                  "name": "actionType"
                }
              }
            }
          },
          {
            "name": "allowedRecipients",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "allowedDomainsHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "expiry",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "oath",
      "docs": [
        "A signed, scoped, time-bound, stake-backed commitment by an agent.",
        "",
        "PDA seeds: [\"oath\", user_pubkey, agent_pubkey, oath_id (u64 LE)].",
        "",
        "The stake vault is a separate system-owned PDA with zero data,",
        "derived from this account's address. Its lamports represent the",
        "agent's collateral.",
        "",
        "INVARIANTS:",
        "- `spent <= spend_cap` at all times.",
        "- `per_tx_cap <= spend_cap`.",
        "- `status == Active` is required for every `record_action`.",
        "- `status` transitions are one-way (enforced in handlers).",
        "- `stake_amount > 0` at creation (zero-stake oaths are",
        "meaningless since slashing cannot punish)."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "agent",
            "type": "pubkey"
          },
          {
            "name": "oathId",
            "type": "u64"
          },
          {
            "name": "purposeHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "purposeUri",
            "type": "string"
          },
          {
            "name": "spendCap",
            "type": "u64"
          },
          {
            "name": "spent",
            "type": "u64"
          },
          {
            "name": "perTxCap",
            "type": "u64"
          },
          {
            "name": "stakeAmount",
            "type": "u64"
          },
          {
            "name": "stakeVault",
            "type": "pubkey"
          },
          {
            "name": "allowedActionTypes",
            "type": {
              "vec": {
                "defined": {
                  "name": "actionType"
                }
              }
            }
          },
          {
            "name": "allowedRecipients",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "allowedDomainsHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "expiry",
            "type": "i64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "oathStatus"
              }
            }
          },
          {
            "name": "actionCount",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "oathCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oath",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "agent",
            "type": "pubkey"
          },
          {
            "name": "oathId",
            "type": "u64"
          },
          {
            "name": "spendCap",
            "type": "u64"
          },
          {
            "name": "perTxCap",
            "type": "u64"
          },
          {
            "name": "stakeAmount",
            "type": "u64"
          },
          {
            "name": "expiry",
            "type": "i64"
          },
          {
            "name": "purposeHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "oathExpiredEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oath",
            "type": "pubkey"
          },
          {
            "name": "returnedToAgent",
            "type": "u64"
          },
          {
            "name": "keeperFee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "oathFulfilled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oath",
            "type": "pubkey"
          },
          {
            "name": "returnedToAgent",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "oathRevoked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oath",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "returnedToAgent",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "oathSlashed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oath",
            "type": "pubkey"
          },
          {
            "name": "slasher",
            "type": "pubkey"
          },
          {
            "name": "transferredToUser",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "oathStatus",
      "docs": [
        "Lifecycle states of an oath.",
        "",
        "INVARIANT: transitions are one-way. Active → {Revoked, Slashed,",
        "Fulfilled, Expired}. Terminal states never transition again."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "revoked"
          },
          {
            "name": "slashed"
          },
          {
            "name": "fulfilled"
          },
          {
            "name": "expired"
          }
        ]
      }
    },
    {
      "name": "recordActionArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "actionType",
            "type": {
              "defined": {
                "name": "actionType"
              }
            }
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "slashArgs",
      "docs": [
        "A slash is authorized by an Ed25519 signature from the oracle",
        "over the bytes `oath_pda || violation_tx_sig`. The caller bundles",
        "an Ed25519 precompile instruction as ix[0] of the transaction; our",
        "handler introspects it via the instructions sysvar."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "violationTxSig",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          }
        ]
      }
    }
  ]
};
