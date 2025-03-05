import json

with open("raw_data/2025_03_03/2025_03_03/claim_reviews.json") as f:
    data = json.load(f)


def get_in_a_year(year: str):
    return [
        claim
        for claim in data
        if claim["reviews"][0]
        and claim["reviews"][0]["date_published"] is not None
        and claim["reviews"][0]["date_published"].startswith(year)
    ]


def data_view(table):
    print("Number of records:", len(table))
    publishers = {
        claim["fact_checker"]["name"]: claim["fact_checker"] for claim in table
    }

    publisher_per_country = {}

    for publisher in publishers.values():
        if publisher["country"] not in publisher_per_country:
            publisher_per_country[publisher["country"]] = 0
        publisher_per_country[publisher["country"]] += 1

    print("=====================================")
    print("Unique publishers:", publishers.keys())
    print("Publishers per country:")

    for country, count in publisher_per_country.items():
        print(f"{country}: {count}")

    record_per_country = {}

    for record in table:
        country = record["fact_checker"]["country"]
        if country not in record_per_country:
            record_per_country[country] = 0
        record_per_country[country] += 1

    print("=====================================")
    print("Records per country:")

    for country, count in record_per_country.items():
        print(f"{country}: {count}")

    record_per_publisher = {}

    for record in table:
        publisher = record["fact_checker"]["name"]
        if publisher not in record_per_publisher:
            record_per_publisher[publisher] = 0
        record_per_publisher[publisher] += 1

    print("=====================================")
    print("Records per publishers:")
    for country, count in record_per_publisher.items():
        print(f"{country}: {count}")

    claim_source_per_domain = {}

    for record in table:
        if record["appearances"] and record["appearances"][0] is not None:
            domain = record["appearances"][0].split("/")[2]
        else:
            domain = "No domain"

        if domain not in claim_source_per_domain:
            claim_source_per_domain[domain] = 0
        claim_source_per_domain[domain] += 1

    print("=====================================")
    print("Records per domain:")

    for domain, count in sorted(claim_source_per_domain.items(), key=lambda x: x[1]):
        print(f"{domain}: {count}")


# in_2025 = get_in_a_year("2025")
# in_2024 = get_in_a_year("2024")
# data_view(in_2025)


with open("raw_data/2025_03_03/2025_03_03/claim_reviews_raw.json") as f:
    data = json.load(f)

for record in data:
    if (
        record["author"]
        and "url" in record["author"]
        and "snopes" in record["author"]["url"]
    ):
        print(json.dumps(record, indent=4))
