#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const onml = require('onml');
const json5 = require('json5');
const argv = require('yargs').argv;


const styles = {};

let marker1 = ['marker',
	{
		id: 'arrowhead',
		class: 'arrow_default',
//		style: 'fill:#0041c4',
		markerHeight: 7,
		markerWidth: 10,
		markerUnits: 'strokeWidth',
		viewBox: '0 -4 11 8',
		refX: 15,
		refY: 0,
		orient: 'auto'
	},
	['path', {'d':'M0 -4 11 0 0 4z'}]
];

let marker2 = ['marker',
	{
		id: 'arrowtail',
		class: 'arrow_default',
//		style: 'fill:#0041c4',
		markerHeight: 7,
		markerWidth: 10,
		markerUnits: 'strokeWidth',
		viewBox: '-11 -4 11 8',
		refX: -15,
		refY: 0,
		orient: 'auto'
	},
	['path', {'d':'M0 -4 -11 0 0 4z'}]
];

if (argv.professional) {
	marker1 = ['marker',
		{
			id: 'arrowhead',
			class: 'arrow_compact',
			markerHeight: 4,
			markerWidth: 8,
			markerUnits: 'strokeWidth',
			viewBox: '0 -4 8 8',
			refX: 7,
			refY: 0,
			orient: 'auto'
		},
		['path', {'d':'M0 -4 8 0 0 4z'}]
	];

	marker2 = ['marker',
		{
			id: 'arrowtail',
			class: 'arrow_compact',
			markerHeight: 4,
			markerWidth: 8,
			markerUnits: 'strokeWidth',
			viewBox: '-8 -4 8 8',
			refX: -7,
			refY: 0,
			orient: 'auto'
		},
		['path', {'d':'M0 -4 -8 0 0 4z'}]
	];
}

const marker3 = ['marker',
	{
		id: 'tee',
		class: 'arrow_default tee_path',
		markerHeight: 6,
		markerWidth: 1,
		markerUnits: 'strokeWidth',
		viewBox: '0 0 1 6',
		refX: 0,
		refY: 3,
		orient: 'auto'
	},
	['path', {'d':'M 0 0 L 0 6'}]
];

const defs = ['defs'];

const style = ['style', {type: 'text/css'}];

const getDefStyle = () => `
	text{
		font-size: 11pt;
		font-style: normal;
		font-variant: normal;
		font-weight: normal;
		font-stretch: normal;
		text-align: center;
		fill-opacity: 1;
		font-family: Helvetica
	}
	.h1 { font-size: 33pt; font-weight: bold }
	.h2 { font-size: 27pt; font-weight: bold }
	.h3 { font-size: 20pt; font-weight: bold }
	.h4 { font-size: 14pt; font-weight: bold }
	.h5 { font-size: 11pt; font-weight: bold }
	.h6 { font-size: 8pt;  font-weight: bold }
	.background { stroke:none;fill:white }
	.arrow_default { fill:#0041c4 }
	.arrow_compact { fill:#0041c4;stroke-linecap:round }
	.tee_path { stroke:#0041c4;stroke-width:2 }
	.arc_arrow { marker-end:url(#arrowhead);stroke:#0041c4;stroke-width:1;fill:none }
	.arc_arrow_twosided { marker-start:url(#arrowtail) }
	.arc_bracket { marker-end:url(#tee);marker-start:url(#tee);fill:none;stroke:#0041c4;stroke-width:1 }
	.arc_error { fill:none;stroke:#F00;stroke-width:1 }
	.arc_default { fill:none;stroke:#0041c4;stroke-width:1 }
	.arc_label_default { font-size:11px;dominant-baseline:middle;text-anchor:middle; }
	.arc_label_bg_white { fill:#FFF }
	.arc_label_bg_transparent { fill-opacity:0 }
	.pw_default { fill:none;stroke:#000;stroke-width:1px; }
	.group_path { stroke:#0041c4;stroke-width:1;fill:none }
	.gmarks { stroke:#888;stroke-width:0.5;stroke-dasharray:1,3 }
`.replace(/\s+/g, '');

const res = ['svg',
	{
		id: 'svg',
		xmlns: 'http://www.w3.org/2000/svg',
		'xmlns:xlink': 'http://www.w3.org/1999/xlink',
		height: '0'
	},
	style,
	defs,
	['g', {id: 'waves'}, ['g', {id: 'lanes'}], ['g', {id: 'groups'}]]
];

function getFill (fillClasses, node) {
	const m = node.attr.style.match(/fill:(#[0-9a-fA-F]+);/);
	if (m) {
		const fill = m[1];
		const texts = node.full[2][2].split(':');
		const attr = texts[0];
		const klass = texts[1];
		if (attr === 'fill') {
			fillClasses[klass] = fill;
			console.error(attr, klass, fill);
		}
	}
}

function f2o (name, cb) {
	const full = path.resolve(process.cwd(), name);
	const skinName = path.basename(name, '.svg');
	fs.readFile(full, { encoding: 'utf8'}, function (err, dat) {
		if (err) { throw err; }
		const ml = onml.parse(dat);
		const fillClasses = {
			'.muted': '#aaa',
			'.warning': '#f6b900',
			'.error': '#f60000',
			'.info': '#0041c4',
			'.success': '#00ab00'
		};
		onml.traverse(ml, {
			leave: function (node) {
				switch(node.name) {
					case 'pattern':
						defs.push(node.full);
						break;
					case 'g':
						delete node.attr.transform;
						defs.push(node.full);
						break;
					case 'rect':
						delete node.attr.id;
						break;
					case 'text':
						getFill(fillClasses, node);
						break;
					case 'path':
						delete node.attr.id;
						if (styles[node.attr.style] === undefined) {
							styles[node.attr.style] = 's_wd_' + skinName + '_' + (Object.keys(styles).length + 1);
						}
						node.attr['class'] = styles[node.attr.style];
						delete node.attr.style;
						delete node.attr['sodipodi:nodetypes'];
						delete node.attr['inkscape:connector-curvature'];
						break;
				}
			}
		});
		// marker1[1]['id'] = 'wd_' + skinName + '_' + marker1[1]['id'] ;
		// marker2[1]['id'] = 'wd_' + skinName + '_' + marker2[1]['id'] ;
		// marker3[1]['id'] = 'wd_' + skinName + '_' + marker3[1]['id'] ;
		defs.push(marker1);
		defs.push(marker2);
		defs.push(marker3);

		const fills = Object.keys(fillClasses).map(key =>
			key + '{fill:' + fillClasses[key] + '}');

		const extra = Object.keys(styles).map(key =>
			'.' + styles[key] + '{' + key + '}');

		style.push(getDefStyle() + fills.join('') + extra.join(''));
		cb(
			'var WaveSkin=WaveSkin||{};WaveSkin.' + skinName + '=' +
			json5.stringify(res) +
			';\ntry { module.exports = WaveSkin; } catch(err) {}\n'
		);
	});
}

const opfile = (typeof argv.o === 'string') ? argv.o : undefined ;

let writeTextFile = function(str) {
	fs.writeFile(opfile, str, (err) => {           
        // In case of a error throw err. 
        if (err) throw err; 
    })
}

if (typeof argv.i === 'string') {
	if (opfile === undefined) {
		writeTextFile = console.log ;
	}
	f2o(argv.i, writeTextFile);
}

/* eslint no-console: 0 */
