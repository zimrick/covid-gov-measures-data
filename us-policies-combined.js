
const fs = require("fs").promises
const path = require("path")
const fetch = require("node-fetch")
const d3dsv = require("d3-dsv")
const groupBy = require("lodash/groupBy")
const sortBy = require("lodash/sortBy")

// const src = "https://raw.githubusercontent.com/OxCGRT/USA-covid-policy/master/data/OxCGRT_US_latest.csv"
const src = "https://raw.githubusercontent.com/OxCGRT/covid-policy-tracker/master/data/OxCGRT_latest_combined.csv"
const outputFile = path.join(__dirname, "./public/us-data-combined.csv")

fetch(src)
  .then(res => res.text())
  .then(data => {
    const parsed = d3dsv.csvParse(data)
    const stateFiltered = parsed.filter(d => d.CountryCode === "USA" && d.RegionCode && d.Jurisdiction === "STATE_TOTAL")

    const indicatorsToInclude = [
      "C1_combined",
      "C2_combined",
      "C3_combined",
      "C4_combined",
      "C5_combined",
      "C6_combined",
      "C7_combined",
      "C8_combined",
      "E1_combined",
      "E2_combined",
      "H1_combined",
      "H2_combined",
      "H3_combined",
      "H6_combined",
      "H7_combined",
    ]

    const columnsToInclude = [
      "RegionCode",
      "Date",
    ]

    const subnational = parsed
      .filter(d => d.CountryCode === "USA" && d.RegionCode && d.Jurisdiction === "STATE_TOTAL")
      .filter(d => d.RegionCode !== "US_VI") // Filter out virgin islands
      .map(d => [...columnsToInclude, ...indicatorsToInclude].reduce((acc, cur) => ({
        ...acc,
        [cur]: d[cur], // Make sure to only keep the id instead of the whole indicator
      }), {}))
    
    const groupedByState = groupBy(subnational, o => o.RegionCode)

    const allStateIds = Object.keys(groupedByState)

    const allStateData = allStateIds.map(stateId => {
      const stateTimeSeries = sortBy(groupedByState[stateId], o => parseFloat(o.Date))
    
      const latestData = indicatorsToInclude.map(indicator => {
        const latestIndicatorValue = stateTimeSeries.reduce((acc, cur, i) => {
          const value = parseFloat(cur[indicator])
          if (!i) return { Date: cur.Date, value }
          const isValid = value || value === 0
          return isValid
            ? { Date: cur.Date, value }
            : acc
        }, {})
        return { indicator, ...latestIndicatorValue }
      }).reduce((acc, cur) => {
        acc[cur.indicator] = cur.value
        return acc
      }, {})
    
      return { id: stateId.split("_")[1], ...latestData }
    })

    const csv = d3dsv.csvFormat(allStateData)

    fs.writeFile(outputFile, csv, "utf8").then(() => {
      console.log("Done writing combined US state indicators!")
    })

  })
