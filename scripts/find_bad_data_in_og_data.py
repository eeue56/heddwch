import json
import os
import glob


def main():
    with open("./claim_review_opengraph_database.json") as f:
        data = json.load(f)

    bad_review_urls = []

    for key, value in data.items():
        if "404" in value["title"]:
            bad_review_urls.append(key)

    for file in glob.glob("src/data/*.json"):
        with open(file) as f:
            data = json.load(f)

        indexes_to_remove = []
        prior_length = len(data)
        print("Loading file", file, ", length: ", prior_length)

        for i, x in enumerate(data):
            if x["review_url"] in bad_review_urls:
                print("Bad review in", x["review_url"], "index: ", i)
                indexes_to_remove.append(i)

        if indexes_to_remove:
            print("Removing bad indexes...")
            for i in indexes_to_remove[::-1]:
                del data[i]

        if len(data) < prior_length:
            print("Writing to file, length:", len(data))

            with open(file, "w") as f:
                json.dump(data, f)


main()
