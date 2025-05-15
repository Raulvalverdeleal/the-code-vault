function isLocalhost(req, res, next) {
    try {
        const localIPv4 = '127.0.0.1';
        const localIPv6 = '::1';

        const xForwarded = req.headers['x-forwarded-for'];
        const clientIp = xForwarded
            ? xForwarded.split(',')[0].trim()
            : req.connection.remoteAddress;

        const isLocalhost = !clientIp || [localIPv4, localIPv6].includes(clientIp);
        req.isLocalhost = isLocalhost;

    } catch (error) {
        console.error('Could not determine whether is localhost or not:', error);
        req.isLocalhost = false;
    }

    next();
}

module.exports = isLocalhost;
