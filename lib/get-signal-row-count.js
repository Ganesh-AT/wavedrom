'use strict';

const getSignalRowCount = (content) => {

    let actualContentLength = content.length ;
    let lastNonOverlayIdx = 0 ;
    let maxOverlayLaneIdx = 0 ;
    for (let cIdx = 0; cIdx < actualContentLength; cIdx++) {
        if (content[cIdx][0][2] > maxOverlayLaneIdx) {
            maxOverlayLaneIdx = content[cIdx][0][2] ;
        }
        if (content[cIdx][0][2] === -1) {
            lastNonOverlayIdx = cIdx ;
        }
    }
    actualContentLength = 1 + ((maxOverlayLaneIdx > lastNonOverlayIdx) ? maxOverlayLaneIdx : lastNonOverlayIdx);

    return actualContentLength ;
    
};

module.exports = getSignalRowCount ;