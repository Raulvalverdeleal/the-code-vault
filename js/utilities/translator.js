class Translator {

	#translations
	#lang
	#fallbackLang
	#rgx
	#fallbackRgx

	constructor(defaultTranslations, lang, fallbackLang) {
        
		this.#translations = new Map(Object.entries(defaultTranslations))

		this.#lang = lang ?? fallbackLang
		this.#fallbackLang = fallbackLang
		this.#rgx = new RegExp(`\\[:${this.#lang}\\]([^\\[]+)\\[:]`, 'g')
		this.#fallbackRgx = new RegExp(`\\[:${fallbackLang}\\]([^\\[]+)\\[:]`, 'g')
	}

	getTranslationCount() {
		return this.#translations.size
	}

	mergeTranslations(translations) {
		if (!translations) return
		Object.entries(translations).forEach(([key, value]) => this.#translations.set(key, value))
	}

	getTranslation(key) {
		const template = this.#translations.get(key)
		return template ?? key
	}

	hasTranslation(key) { 
		return this.#translations.has(key)
	}
 
	extractTranslationFromString(str) {
		const hasLanguage = str.includes(`[:${this.#lang}]`)
		const hasFallbackLanguage = str.includes(`[:${this.#fallbackLang}]`)
		let match = null
		this.#rgx.lastIndex = 0
		this.#fallbackRgx.lastIndex = 0
		if (hasLanguage) match = this.#rgx.exec(str)
		else if (hasFallbackLanguage) match = this.#fallbackRgx.exec(str)

		return match ? match[1] : str
	}

	applyPlaceholdersToTemplate(template, ...placeholders) {
		let replaceIndex = 0

		return template.replace(/%[a-z0-9\-]{1,}/g, (match) => {
			let result = ''

			switch (match) {
				case '%end':
					result = '</span>'
					break
				case '%break':
					result = '<br />'
					break
				case '%s':
					result = String(placeholders[replaceIndex] ?? '') 
					replaceIndex = replaceIndex === Math.max(0, placeholders.length - 1) ? 0 : replaceIndex + 1
					break
				default:
					result = `<span class="${match.substring(1)}">`
					break
			}

			return result
		})
	}

	getProcessedTranslation(str, ...placeholders) {
		let result = this.extractTranslationFromString(this.getTranslation(str))
		return this.applyPlaceholdersToTemplate(result, ...placeholders)
	}
}
