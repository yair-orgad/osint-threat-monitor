const CONFIG = {
    weights: { gps: 0.20, air: 0.20, pizza: 0.10, poly: 0.20, oil: 0.15, navy: 0.15 },
    statusScore: { green: 0, orange: 40, red: 70, critical: 90 },
    mediaMap: {
        gps: { type: 'video', prefix: 'gps' },
        air: { type: 'video', prefix: 'notam' },
        pizza: { type: 'image', prefix: 'pizza' },
        poly: { type: 'video', prefix: 'polly' },
        oil: { type: 'video', prefix: 'oil' },
        navy: { type: 'video', prefix: 'sea' }
    }
};