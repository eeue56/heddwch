#!/bin/env bash

mkdir -p src/data

# Norway

cat claim_reviews.json | jq '[.[] | select( .fact_checker.name == "faktiskno" and (.label == "credible"))] | .[:50]' > src/data/norwegian_credible.json

cat claim_reviews.json | jq '[.[] | select( .fact_checker.name == "faktiskno" and (.label == "not_credible"))] | .[:50]' > src/data/norwegian_not_credible.json

# USA

cat claim_reviews.json | jq '[.[] | select((.claim_text[0] | contains("Says") | not) and (.claim_text[0] | contains("On") | not) and .fact_checker.name == "politifact" and (.label == "credible")) ] | .[:50]'  > src/data/usa_credible.json

cat claim_reviews.json | jq '[.[] | select((.claim_text[0] | contains("Says") | not) and (.claim_text[0] | contains("On") | not) and .fact_checker.name == "politifact" and (.label == "not_credible")) ] | .[:50]'  > src/data/usa_not_credible.json

# UK

cat claim_reviews.json | jq '[.[] | select(.fact_checker.name == "full-fact" and (.label == "credible"))] | .[:50]' > src/data/uk_credible.json

cat claim_reviews.json | jq '[.[] | select(.fact_checker.name == "full-fact" and (.label == "not_credible"))] | .[:50]' > src/data/uk_not_credible.json

# Sweden

cat claim_reviews.json |
    jq '[.[]
        | select(
            (
                (.claim_text[0]
                    | contains("Sweden")
                )
            or
                (.claim_text[0]
                    | contains("Sverige")
                )
            or
                (.claim_text[0]
                    | contains("Stockholm")
                )
            or
                (.claim_text[0]
                    | contains("Swedish")
                )
            or
                (.claim_text[0]
                    | contains("Svensk")
                )
            )
            and
                (.fact_checker.name == "full-fact" or .fact_checker.name == "faktiskno" or .fact_checker.name == "politifact" or .fact_checker.name == "snopescom")
            and
                (.label == "credible")
            )
        ]
    | .[:50]' > src/data/sweden_credible.json

cat claim_reviews.json |
    jq '[.[]
        | select(
            (
                (.claim_text[0]
                    | contains("Sweden")
                )
            or
                (.claim_text[0]
                    | contains("Sverige")
                )
            or
                (.claim_text[0]
                    | contains("Stockholm")
                )
            or
                (.claim_text[0]
                    | contains("Swedish")
                )
            or
                (.claim_text[0]
                    | contains("Svensk")
                )
            )
            and
                (.fact_checker.name == "full-fact" or .fact_checker.name == "faktiskno" or .fact_checker.name == "politifact" or .fact_checker.name == "snopescom")
            and
                (.label == "not_credible")
            )
        ]
    | .[:50]' > src/data/sweden_not_credible.json

# Print some stats

for filename in src/data/*.json; do
    echo "${filename}"
    len=$(jq length "${filename}")
    echo "Number of entries: ${len}"

    if [[ $len -lt 10 ]]; then
        echo ">>> Too few entries!"
    fi

    sources=$(cat "${filename}" | jq ".[].fact_checker.name" | sort | uniq)
    echo "Sources: ${sources}"

    echo "------------------------"
done