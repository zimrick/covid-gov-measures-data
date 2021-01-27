
const fs = require("fs").promises
const path = require("path")
const fetch = require("node-fetch")
const d3dsv = require("d3-dsv")
const groupBy = require("lodash/groupBy")
const sortBy = require("lodash/sortBy")

const src = "https://raw.githubusercontent.com/OxCGRT/USA-covid-policy/master/data/OxCGRT_US_latest.csv"
const outputFile = path.join(__dirname, "./public/us-data.csv")

fetch(src)
  .then(res => res.text())
  .then(data => {
    const parsed = d3dsv.csvParse(data)

    const indicatorsToInclude = [
      "C1_School closing",
      "C2_Workplace closing",
      "C3_Cancel public events",
      "C4_Restrictions on gatherings",
      "C5_Close public transport",
      "C6_Stay at home requirements",
      "C7_Restrictions on internal movement",
      "C8_International travel controls",
      "E1_Income support",
      "E2_Debt/contract relief",
      "H1_Public information campaigns",
      "H2_Testing policy",
      "H3_Contact tracing",
      "H6_Facial Coverings",
      "H7_Vaccination policy",
    ]

    const columnsToInclude = [
      "RegionCode",
      "Date",
    ]

    const notesToInclude = indicatorsToInclude.map(d => d.split("_")[0] + "_Notes")

    const subnational = parsed
      .filter(d => d.RegionCode && d.Jurisdiction === "STATE_WIDE")
      .filter(d => d.RegionCode !== "US_VI") // Filter out virgin islands
      .map(d => [...columnsToInclude, ...indicatorsToInclude, ...notesToInclude].reduce((acc, cur) => ({
        ...acc,
        [cur]: d[cur], // Make sure to only keep the id instead of the whole indicator
      }), {}))

    const groupedByState = groupBy(subnational, o => o.RegionCode)

    const allStateIds = Object.keys(groupedByState)

    const allStateData = allStateIds.map(stateId => {
      const stateTimeSeries = sortBy(groupedByState[stateId], o => parseInt(o.Date))

      const latestData = indicatorsToInclude.map(indicator => {
        const latestIndicatorValue = stateTimeSeries.reduce((acc, cur, i) => {
          const notesId = indicator.split("_")[0] + "_Notes"
          const value = parseInt(cur[indicator])
          if (!i) return { Date: cur.Date, value, notes: cur[notesId] }
          const isValid = value || value === 0
          return isValid
            ? { Date: cur.Date, value, notes: cur[notesId] ? cur[notesId] : acc.notes ? acc.notes : "NO NOTES" }
            : acc
        }, {})
        return { indicator, ...latestIndicatorValue }
      }).reduce((acc, cur) => {
        // acc[cur.indicator] = { date: cur.Date, value: cur.value }

        acc[cur.indicator] = cur.value
        acc[cur.indicator.split("_")[0] + "_Notes"] = cur.notes
        return acc
      }, {})

      return { id: stateId.split("_")[1], ...latestData }
    })

    const csv = d3dsv.csvFormat(allStateData)

    fs.writeFile(outputFile, csv, "utf8").then(() => {
      console.log("Done writing US state indicators!")
    })

  })
