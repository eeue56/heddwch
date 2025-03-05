#!/bin/env bash

mkdir -p src/data

claim_review_json_file="./raw_data/claim_reviews.json"

# Norway

cat "${claim_review_json_file}" | jq '[.[] | select( .fact_checker.name == "faktiskno" and (.label == "credible"))] | .[:50]' > web/data/norwegian_credible.json

cat "${claim_review_json_file}" | jq '[.[] | select( .fact_checker.name == "faktiskno" and (.label == "not_credible"))] | .[:50]' > web/data/norwegian_not_credible.json

# USA

cat "${claim_review_json_file}" | jq '[.[] | select((.claim_text[0] | contains("Says") | not) and (.claim_text[0] | contains("On") | not) and (.claim_text[0] | contains("http://") | not) and (.claim_text[0] | contains("https://") | not) and .fact_checker.name == "politifact" and (.label == "credible")) ] | .[:50]'  > web/data/usa_credible.json

cat "${claim_review_json_file}" | jq '[.[] | select((.claim_text[0] | contains("Says") | not) and (.claim_text[0] | contains("On") | not) and (.claim_text[0] | contains("http://") | not) and (.claim_text[0] | contains("https://") | not) and .fact_checker.name == "politifact" and (.label == "not_credible")) ] | .[:50]'  > web/data/usa_not_credible.json

# UK

cat "${claim_review_json_file}" | jq '[.[] | select(.fact_checker.name == "full-fact" and (.label == "credible"))] | .[:50]' > web/data/uk_credible.json

cat "${claim_review_json_file}" | jq '[.[] | select(.fact_checker.name == "full-fact" and (.label == "not_credible"))] | .[:50]' > web/data/uk_not_credible.json

# Sweden

cat "${claim_review_json_file}" |
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

cat "${claim_review_json_file}" |
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
    | .[:50]' > web/data/sweden_not_credible.json

# Headlines

echo "Headlines..."

cat "${claim_review_json_file}"  | jq '[.[]
    |
        select((.label == "credible")
            and (.fact_checker.name != "africa-check")
            and (.fact_checker.name != "check-your-fact")
            and (.fact_checker.language == "English")
            and (
                (.fact_checker.country == "United States")
                or (.fact_checker.country == "Sweden")
                or (.fact_checker.country == "Canada")
                or (.fact_checker.country == "Norway")
                or (.fact_checker.country == "United Kingdom")
            )
            and (
                (.reviews[0].date_published != null)
                and (
                    (.reviews[0].date_published | startswith("2025"))
                )
            )
            and (.reviews[0].original_label | length > 10)
        )
    ] | sort_by(.reviews[0].original_label | length) | reverse | .[:50]' > web/data/headlines_credible.json

cat "${claim_review_json_file}"  | jq '[.[]
    |
        select(
            (.label == "not_credible")
            and (.fact_checker.name != "africa-check")
            and (.fact_checker.name != "check-your-fact")
            and (.fact_checker.language == "English")
            and (
                (.fact_checker.country == "United States")
                or (.fact_checker.country == "Sweden")
                or (.fact_checker.country == "Canada")
                or (.fact_checker.country == "Norway")
                or (.fact_checker.country == "United Kingdom")
            )
            and (
                (.reviews[0].date_published != null)
                and (
                    (.reviews[0].date_published | startswith("2025"))
                )
            )
            and (.reviews[0].original_label | length > 10)
        )
    ] | sort_by(.reviews[0].original_label | length) | reverse | .[:50]' > web/data/headlines_not_credible.json



# Print some stats

for filename in web/data/*.json; do
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

