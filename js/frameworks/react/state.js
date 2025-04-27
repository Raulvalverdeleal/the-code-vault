class State {

    _data
    _render
    _localStorageKey
    _sessionStorageKey
    _dataEffect

    constructor (data, {localStorageKey, sessionStorageKey} = {}) {

        this._render = undefined
        this._data = JSON.parse(JSON.stringify(data))
        this._localStorageKey = localStorageKey
        this._sessionStorageKey = sessionStorageKey
        this._dataEffect = new Map()
    }

    render() {

        if (!this._render) throw new Error('state has not render funciton yet')
		this._render()
	}
    
    setRender(callback) {

        if (typeof callback !== 'function') throw new Error('invalid render function')
		if (!this._render) this._render = callback
	}

    _setData (data) {

        this._data = data
        if (this._localStorageKey) localStorage.setItem(this._localStorageKey, data)
        if (this._sessionStorageKey) sessionStorage.setItem(this._sessionStorageKey, data)

        this._dataEffect.forEach(callback => {
            if (typeof callback !== 'function') throw new Error('Invalid callback, not a function')
            callback()
        })

        return {render: this._render}
    }
}
