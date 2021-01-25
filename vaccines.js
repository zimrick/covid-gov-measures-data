
const fs = require("fs").promises
const path = require("path")
const fetch = require("node-fetch")
const d3dsv = require("d3-dsv")
const groupBy = require("lodash/groupBy")
const sortBy = require("lodash/sortBy")
const dayjs = require("dayjs")

const src = "https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/vaccinations.csv"
const outputFile = path.join(__dirname, "./public/vaccination-data.csv")

fetch(src)
  .then(res => res.text())
  .then(data => {
    const parsed = d3dsv.csvParse(data)

    const groupedByCountry = groupBy(parsed, o => o.iso_code)

    const filtered = Object.keys(groupedByCountry)
      .filter(d => d.length)
    
    const latestData = filtered.map(isoCode => {
      const vaccinationData = groupedByCountry[isoCode]
      const sorted = sortBy(vaccinationData, o => {
        return +dayjs(o.date).format("YYYYMMDD")
      }).reverse()
      return sorted[0]
    }).map(d => {
      return {
        location: d.location,
        iso_code: d.iso_code,
        date: d.date,
        total_vaccinations: d.total_vaccinations,
        people_vaccinated: d.people_vaccinated,
        total_vaccinations_per_hundred: d.total_vaccinations_per_hundred,
        people_vaccinated_per_hundred: d.people_vaccinated_per_hundred,
      }
    })

    const csv = d3dsv.csvFormat(latestData)

    fs.writeFile(outputFile, csv, "utf8").then(() => {
      console.log("Done writing vaccination data!")
    })

  })
