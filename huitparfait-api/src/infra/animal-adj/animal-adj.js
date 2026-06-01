import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export default function (lang) {

    const data = require(`./animal-adj-data.${lang}.json`)

    const animalLength = data.animals.length
    const adjectivesLength = data.adjectives.length
    const totalLength = animalLength * adjectivesLength

    function ucfirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1)
    }


    return function transform(input = Math.random()) {

        const lowerAlphaNumericString = String(input).toLowerCase().replace(/[^a-z0-9]/g, '')
        const reallyBigInteger = parseInt(lowerAlphaNumericString, 36)
        const integer = reallyBigInteger % totalLength

        const animalIndex = Math.floor(integer / animalLength)
        const adjectiveIndex = integer % adjectivesLength

        const animal = data.animals[animalIndex]
        const adjectiveEntry = data.adjectives[adjectiveIndex]
        const genre = animal.genre === 'f' ? 'f' : 'm'
        const adjective = typeof adjectiveEntry === 'string'
            ? adjectiveEntry
            : adjectiveEntry[genre]
        const animalName = typeof animal === 'string' ? animal : animal.name

        return `${ucfirst(adjective)} ${ucfirst(animalName)}`
    }
}
