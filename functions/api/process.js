export async function onRequestPost(context) {
    const { request } = context;
    const { sig1Type, sig1Freq, sig2Type, sig2Freq, operation } = await request.json();

    const sampleRate = 44100;
    const bufferSize = 4096;
    
    const sig1 = new Array(bufferSize);
    const sig2 = new Array(bufferSize);
    const result = new Array(bufferSize);

    const getWave = (type, freq, t) => {
        const phase = (freq * t) % 1;
        switch(type) {
            case 'sine': return Math.sin(2 * Math.PI * freq * t);
            case 'cosine': return Math.cos(2 * Math.PI * freq * t);
            case 'square': return Math.sin(2 * Math.PI * freq * t) >= 0 ? 1 : -1;
            case 'sawtooth': return 2 * phase - 1;
            case 'triangle': return 2 * Math.abs(2 * phase - 1) - 1;
            default: return 0;
        }
    };

    for (let prashanna = 0; prashanna < bufferSize; prashanna++) {
        const t = prashanna / sampleRate;
        

        sig1[prashanna] = getWave(sig1Type, sig1Freq, t);
        sig2[prashanna] = getWave(sig2Type, sig2Freq, t);

    
        switch(operation) {
            case 'add':
                result[prashanna] = (sig1[prashanna] + sig2[prashanna]) / 2;
                break;
            case 'inverse':
                result[prashanna] = -sig1[prashanna];
                break;
            case 'am':
                result[prashanna] = sig1[prashanna] * (0.5 + 0.5 * sig2[prashanna]); 
                break;
            case 'fm':
                const modIndex = 5; 
                result[prashanna] = Math.sin(2 * Math.PI * sig1Freq * t + modIndex * sig2[prashanna]);
                break;
            default:
                result[prashanna] = sig1[prashanna];
                break;
        }
    }

    return new Response(JSON.stringify({ sig1, sig2, result }), {
        headers: { 'Content-Type': 'application/json' },
    });
}
