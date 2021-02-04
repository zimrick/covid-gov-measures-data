
const fs = require("fs").promises
const path = require("path")
const fetch = require("node-fetch")
const d3dsv = require("d3-dsv")
const groupBy = require("lodash/groupBy")
const sortBy = require("lodash/sortBy")
const dayjs = require("dayjs")

const src = "https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/us_state_vaccinations.csv"
const outputFile = path.join(__dirname, "./public/us-vaccination-data.csv")

const states = [
  { id: "AL", name: "Alabama" },
  { id: "AK", name: "Alaska" },
  { id: "AZ", name: "Arizona" },
  { id: "AR", name: "Arkansas" },
  { id: "CA", name: "California" },
  { id: "CO", name: "Colorado" },
  { id: "CT", name: "Connecticut" },
  { id: "DE", name: "Delaware" },
  { id: "DC", name: "District of Columbia" },
  { id: "FL", name: "Florida" },
  { id: "GA", name: "Georgia" },
  { id: "HI", name: "Hawaii" },
  { id: "ID", name: "Idaho" },
  { id: "IL", name: "Illinois" },
  { id: "IN", name: "Indiana" },
  { id: "IA", name: "Iowa" },
  { id: "KS", name: "Kansas" },
  { id: "KY", name: "Kentucky" },
  { id: "LA", name: "Louisiana" },
  { id: "ME", name: "Maine" },
  { id: "MD", name: "Maryland" },
  { id: "MA", name: "Massachusetts" },
  { id: "MI", name: "Michigan" },
  { id: "MN", name: "Minnesota" },
  { id: "MS", name: "Mississippi" },
  { id: "MO", name: "Missouri" },
  { id: "MT", name: "Montana" },
  { id: "NE", name: "Nebraska" },
  { id: "NV", name: "Nevada" },
  { id: "NH", name: "New Hampshire" },
  { id: "NJ", name: "New Jersey" },
  { id: "NM", name: "New Mexico" },
  { id: "NY", name: "New York State" },
  { id: "NC", name: "North Carolina" },
  { id: "ND", name: "North Dakota" },
  { id: "OH", name: "Ohio" },
  { id: "OK", name: "Oklahoma" },
  { id: "OR", name: "Oregon" },
  { id: "PA", name: "Pennsylvania" },
  { id: "RI", name: "Rhode Island" },
  { id: "SC", name: "South Carolina" },
  { id: "SD", name: "South Dakota" },
  { id: "TN", name: "Tennessee" },
  { id: "TX", name: "Texas" },
  { id: "UT", name: "Utah" },
  { id: "VT", name: "Vermont" },
  { id: "VA", name: "Virginia" },
  { id: "WA", name: "Washington" },
  { id: "WV", name: "West Virginia" },
  { id: "WI", name: "Wisconsin" },
  { id: "WY", name: "Wyoming" },
  { id: "USA", name: "United States" },
  // "Puerto Rico",
]

fetch(src)
  .then(res => res.text())
  .then(data => {
    const parsed = d3dsv.csvParse(data)

    const groupedByCountry = groupBy(parsed, o => o.location)

    const filtered = Object.keys(groupedByCountry)
      .filter(d => d.length && states.map(d => d.name).includes(d))

    const latestData = filtered.map(isoCode => {
      const vaccinationData = groupedByCountry[isoCode]
      const sorted = sortBy(vaccinationData, o => {
        return +dayjs(o.date).format("YYYYMMDD")
      }).reverse()
      return sorted[0]
    }).map(d => {
      const metaData = states.find(s => s.name === d.location) || {}
      return {
        location: d.location,
        iso_code: metaData.id || "",
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
