'use strict';

const getRenderedTextBox = require('./get-rendered-text-box.js');

function parseConfig (source, lane) {
    function tonumber (x) {
        return x > 0 ? x : 1;
    }

    lane.hscale = 1;
    lane.downscale = 1 ;
    lane.tr_upscale = 1;

    if (lane.hscale0) {
        lane.hscale = lane.hscale0;
    }

    let hscale_r = Math.round(tonumber(source.config.hscale));
    if (hscale_r > 0) {
        if (hscale_r > 100) {
            hscale_r = 100;
        }
        lane.hscale = hscale_r;
    } 
    if ((source.config.hscale > 0) && (source.config.hscale < 1)) { // hscale between (0,1)
        lane.downscale = source.config.hscale ;
        lane.tr_upscale = 1.00 / source.config.hscale ;
    }

    lane.yh0 = 0;
    lane.yh1 = 0;
    lane.head = source.head;

    lane.xmin_cfg = 0;
    lane.xmax_cfg = 1e12; // essentially infinity
    if (  source.config.hbounds[0] < source.config.hbounds[1] ) {
        // convert hbounds ticks min, max to bricks min, max
        // TODO: do we want to base this on ticks or tocks in
        //  head or foot?  All 4 can be different... or just 0 reference?
        lane.xmin_cfg = Math.floor(2 * source.config.hbounds[0]);
        lane.xmax_cfg = Math.ceil(2 * source.config.hbounds[1]);
    } else {
        // Not sure about the purpose of this
        source.config.hbounds[0] = Math.floor(source.config.hbounds[0]);
        source.config.hbounds[1] = Math.ceil(source.config.hbounds[1]);
    }

    if (source && source.head) {
        const tickType = (typeof source.head.tick) ;
        const tockType = (typeof source.head.tock) ;
        if ((tickType !==  'undefined') || (tockType !== 'undefined')) {
            lane.yh0 = 20;
        }
        if (source.head.text) {
            const headTextParams = getRenderedTextBox(source.head.text);
            lane.yh1 = 30 + headTextParams.fBBox.height ;
            lane.head.text = source.head.text;
        }

        /*
        // These need to be moved to render-marks
        // Number of tick entries will be lane.xmax / (2 * lane.hscale)
        if (tickType === 'string') {
            source.head.tick = source.head.tick.trim().split(/\s+/);
        }


        // if tick defined, modify start tick by lane.xmin_cfg
        if ( source.head.tick || source.head.tick === 0 ) {
            source.head.tick = (typeof source.head.tick === 'number') ? (source.head.tick + lane.xmin_cfg/2) :
                source.head.tick ;
        }
        // if tock defined, modify start tick by lane.xmin_cfg
        if ( source.head.tock || source.head.tock === 0 ) {
            source.head.tock = source.head.tock + lane.xmin_cfg/2;
        }
        */

    }

    lane.yf0 = 0;
    lane.yf1 = 0;
    lane.foot = source.foot;
    if (source && source.foot) {
        const tickType = (typeof source.foot.tick) ;
        const tockType = (typeof source.foot.tock) ;
        if ((tickType !==  'undefined') || (tockType !== 'undefined')) {
            lane.yf0 = 20;
        }
        if (source.foot.text) {
            const footTextParams = getRenderedTextBox(source.foot.text);
            lane.yf1 = 30 + footTextParams.fBBox.height ;
            lane.foot.text = source.foot.text;
        }
        /*
        if (
            source.foot.tick || source.foot.tick === 0 ||
            source.foot.tock || source.foot.tock === 0
        ) {
            lane.yf0 = 20;
        }
        // if tick defined, modify start tick by lane.xmin_cfg
        if ( source.foot.tick || source.foot.tick === 0 ) {
            source.foot.tick = (typeof source.foot.tick === 'number') ? (source.foot.tick + lane.xmin_cfg/2) :
                source.foot.tick ;
        }
        // if tock defined, modify start tick by lane.xmin_cfg
        if ( source.foot.tock || source.foot.tock === 0 ) {
            source.foot.tock = source.foot.tock + lane.xmin_cfg/2;
        }

        if (source.foot.text) {
        }
        */
    }

    lane.ocfg = source.config ;

} /* eslint complexity: [1, 30] no-console: 0 */

module.exports = parseConfig;
