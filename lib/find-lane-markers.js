'use strict';

function findLaneMarkers (lanetext) {
    let gcount = 0;
    let lcount = 0;
    const ret = [];

    lanetext.forEach(function (e) {
        const lanetextMember = (e === undefined) ? '' : e.replace(/wd_.*_/, '') ;
        if (
            (lanetextMember === 'vvv-2') ||
            (lanetextMember === 'vvv-3') ||
            (lanetextMember === 'vvv-4') ||
            (lanetextMember === 'vvv-5') ||
            (lanetextMember === 'vvv-6') ||
            (lanetextMember === 'vvv-7') ||
            (lanetextMember === 'vvv-8') ||
            (lanetextMember === 'vvv-9')
        ) {
            lcount += 1;
        } else {
            if (lcount !== 0) {
                ret.push(gcount - ((lcount + 1) / 2));
                lcount = 0;
            }
        }
        gcount += 1;

    });

    if (lcount !== 0) {
        ret.push(gcount - ((lcount + 1) / 2));
    }

    return ret;
}

module.exports = findLaneMarkers;
