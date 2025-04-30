function someNaN(...values) {
    return values.some(value => isNaN(value))
}