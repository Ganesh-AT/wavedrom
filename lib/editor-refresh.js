'use strict';

const eva = require('./eva.js');
const renderWaveForm = require('./render-wave-form.js');

function editorRefresh () {

    renderWaveForm(0, eva('InputJSON_0'), 'WaveDrom_Display_');

}

module.exports = editorRefresh;
