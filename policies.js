
const fs = require("fs").promises
const path = require("path")
const d3dsv = require("d3-dsv")
const groupBy = require("lodash/groupBy")
const fetch = require("node-fetch")
const dayjs = require("dayjs")

const src = "https://raw.githubusercontent.com/OxCGRT/covid-policy-tracker/master/data/OxCGRT_latest_responses.csv"
const outputFile = path.join(__dirname, "./public/data.csv")

fetch(src)
  .then(res => res.text())
  .then(data => {
    const parsed = d3dsv.csvParse(data)

    const activeResponses = parsed.filter(d => !d.EndDate)
    const grouped = groupBy(activeResponses, o => o.CountryCode)

    const reformatted = Object.keys(grouped).map(countryCode => {
      const countryData = grouped[countryCode]
      const base = {
        name: countryData[0].CountryName,
        id: countryData[0].CountryCode,
        updated: dayjs().format("ddd DD.MM.YYYY"),
      }

      countryData.forEach(d => {
        const policyTypePrefix = d.PolicyType.split(":")[0]
        base[policyTypePrefix + "_" + d.PolicyType.split(" ").slice(1)/*.map(d => d.toLowerCase())*/.join(" ")] = d.PolicyValue
        base["notes_" + policyTypePrefix] = d.InitialNote
      })

      return base
    })

    const csv = d3dsv.csvFormat(reformatted)

    fs.writeFile(outputFile, csv, "utf8").then(() => {
      console.log("Done writing indicators!")
    })

  })
