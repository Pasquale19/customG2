
"use strict"

/**
 * g2.ext (c) 2015-21 Stefan Goessner
 * @author Stefan Goessner
 * @license MIT License
 * @requires g2.core.js
 * @typedef {g2}
 * @description Additional methods for g2.
 * @returns {g2}
 */

var g2 = g2 || { prototype: {} };  // for jsdoc only ...

// constants for element selection / editing
g2.NONE = 0x0; g2.OVER = 0x1; g2.DRAG = 0x2; g2.EDIT = 0x4;

/**
 * Extended style values.
 * Not really meant to get overwritten. But if you actually want, proceed.<br>
 * These styles can be referenced using the comfortable '@' syntax.
 * @namespace
 * @property {object} symbol  `g2` symbol namespace.
 * @property {object} [symbol.tick] Predefined symbol: a little tick
 * @property {object} [symbol.dot] Predefined symbol: a little dot
 * @property {object} [symbol.sqr] Predefined symbol: a little square
 * @property {string} [symbol.nodcolor=#333]    node color.
 * @property {string} [symbol.nodfill=#dedede]   node fill color.
 * @property {string} [symbol.nodfill2=#aeaeae]  alternate node fill color, somewhat darker.
 * @property {string} [symbol.linkcolor=#666]   link color.
 * @property {string} [symbol.linkfill=rgba(225,225,225,0.75)]   link fill color, semi-transparent.
 * @property {string} [symbol.dimcolor=darkslategray]   dimension color.
 * @property {array} [symbol.solid=[]]   solid line style.
 * @property {array} [symbol.dash=[15,10]]   dashed line style.
 * @property {array} [symbol.dot=[4,4]]   dotted line style.
 * @property {array} [symbol.dashdot=[25,6.5,2,6.5]]   dashdotted line style.
 * @property {number} [symbol.labelOffset=5]    default label offset distance.
 * @property {number} [symbol.labelSignificantDigits=3]   default label's significant digits after numbering point.
 */
g2.symbol = g2.symbol || {};
g2.symbol.tick = g2().p().m({ x: 0, y: -2 }).l({ x: 0, y: 2 }).stroke({ lc: "round", lwnosc: true });
g2.symbol.dot = g2().cir({ x: 0, y: 0, r: 2, ls: "transparent" });
g2.symbol.sqr = g2().rec({ x: -1.5, y: -1.5, b: 3, h: 3, ls: "transparent" });

g2.symbol.nodcolor = "#333";
g2.symbol.nodfill = "#dedede";
g2.symbol.nodfill2 = "#aeaeae";
g2.symbol.linkcolor = "#666";
g2.symbol.linkfill = "rgba(225,225,225,0.75)";
g2.symbol.dimcolor = "darkslategray";
g2.symbol.solid = [];
g2.symbol.dash = [15, 10];
g2.symbol.dot = [4, 4];
g2.symbol.dashdot = [25, 6.5, 2, 6.5];
g2.symbol.labelSignificantDigits = 3;  //  0.1234 => 0.123,  0.01234 => 0.0123, 1.234 => 1.23, 12.34 => 12.3, 123.4 => 123, 1234 => 1234

/**
* Flatten object properties (evaluate getters)
*/
g2.flatten = function (obj) {
    const args = Object.create(null); // important !
    for (let p in obj)
        if (typeof obj[p] !== 'function')
            args[p] = obj[p];
    return args;
}
/*
g2.strip = function(obj,prop) {
    const clone = Object.create(Object.getPrototypeOf(obj),Object.getOwnPropertyDescriptors(obj));
    Object.defineProperty(clone, prop, { get:undefined, enumerable:true, configurable:true, writabel:false });
    return clone;
}
*/
g2.pointIfc = {
    // p vector notation !  ... helps to avoid object destruction
    get p() { return { x: this.x, y: this.y }; },  // visible if 'p' is *not* explicite given. 
    get x() { return Object.getOwnPropertyDescriptor(this, 'p') ? this.p.x : 0; },
    get y() { return Object.getOwnPropertyDescriptor(this, 'p') ? this.p.y : 0; },
    set x(q) { if (Object.getOwnPropertyDescriptor(this, 'p')) this.p.x = q; },
    set y(q) { if (Object.getOwnPropertyDescriptor(this, 'p')) this.p.y = q; },
}

g2.labelIfc = {
    getLabelOffset() { const off = this.label.off !== undefined ? +this.label.off : 1; return off + Math.sign(off) * (this.lw || 2) / 2; },
    getLabelString() {
        let s = typeof this.label === 'object' ? this.label.str : typeof this.label === 'string' ? this.label : '?';
        if (s && s[0] === "@" && this[s.substr(1)]) {
            s = s.substr(1);
            let val = this[s];
            val = Number.isInteger(val) ? val
                : Number(val).toFixed(Math.max(g2.symbol.labelSignificantDigits - Math.log10(val), 0));

            s = `${val}${s === 'angle' ? "°" : ""}`;
        }
        return s;
    },
    drawLabel(g) {
        const lbl = this.label;
        const font = lbl.font || g2.defaultStyle.font;
        const h = parseInt(font);   // font height (px assumed !)
        const str = this.getLabelString();
        const rx = (str.length || 1) * 0.65 * h / 2, 
              ry = 1.25 * h / 2;   // ellipse semi-axes length 
        const pos = this.pointAt(lbl.loc || this.lbloc || 'se');
        const off = this.getLabelOffset();
        const p = {
            x: pos.x + pos.nx * (off + Math.sign(off) * rx),
            y: pos.y + pos.ny * (off + Math.sign(off) * ry)
        };
        if (lbl.border) g.ell({ x: p.x, y: p.y, rx, ry, ls: lbl.fs || 'black', fs: lbl.fs2 || '#ffc' });
        g.txt({
            str, x: p.x, y: p.y,
            thal: "center", tval: "middle",
            fs: lbl.fs || this.ls || 'black', font: lbl.font
        });
        return g;
    }
}

g2.markIfc = {
    markAt(loc) {
        const p = this.pointAt(loc);
        const w = Math.atan2(p.ny, p.nx) + Math.PI / 2;
        return {
            grp: this.getMarkSymbol(), x: p.x, y: p.y, w: w, scl: this.lw || 1,
            ls: this.ls || '#000', fs: this.fs || this.ls || '#000'
        }
    },
    getMarkSymbol() {
        // Use tick as default
        const mrk = this.mark
        if (typeof mrk === 'number' || !mrk) return g2.symbol.tick;
        if (typeof mrk.symbol === 'object') return mrk.symbol;
        if (typeof mrk.symbol === 'string') return g2.symbol[mrk.symbol]
    },
    // loop is for elements that close, e.g. rec or cir => loc at 0 === loc at 1
    drawMark(g, closed = false) {
        let loc;
        if (Array.isArray(this.mark)) {
            loc = this.mark;
        }
        else {
            const count = typeof this.mark === 'object' ? this.mark.count : this.mark;
            loc = count ?
                Array.from(Array(count)).map((_, i) => i / (count - !closed)) :
                this.mark.loc;
        }
        for (let l of loc) {
            g.use(this.markAt(l));
        }
        return g;
    }
}

g2.prototype.cir.prototype = g2.mix(g2.pointIfc, g2.labelIfc, g2.markIfc, {
    w: 0,   // default start angle (used for dash-dot orgin and editing)
    lbloc: 'c',
    get isSolid() { return this.fs && this.fs !== 'transparent' },
    get len() { return 2 * Math.PI * this.r; },
    get lsh() { return this.state & g2.OVER; },
    get sh() { return this.state & g2.OVER ? [0, 0, 5, "black"] : false },
    get g2() {      // dynamically switch existence of method via getter ... cool !
        const e = g2(); // hand object stripped from `g2`
        this.label && e.ins((g) => this.drawLabel(g));
        this.mark && e.ins((g) => this.drawMark(g, true));
        return () => g2().cir(g2.flatten(this)).ins(e); // avoiding infinite recursion !
    },
    pointAt(loc) {
        const Q = Math.SQRT2 / 2;
        const LOC = { c: [0, 0], e: [1, 0], ne: [Q, Q], n: [0, 1], nw: [-Q, Q], w: [-1, 0], sw: [-Q, -Q], s: [0, -1], se: [Q, -Q] };
        const q = (loc + 0 === loc) ? [Math.cos(loc * 2 * Math.PI), Math.sin(loc * 2 * Math.PI)]
            : (LOC[loc || "c"] || [0, 0]);
        return {
            x: this.x + q[0] * this.r,
            y: this.y + q[1] * this.r,
            nx: q[0],
            ny: q[1]
        };
    },
    hit({ x, y, eps }) {
        return this.isSolid ? g2.isPntInCir({ x, y }, this, eps)
            : g2.isPntOnCir({ x, y }, this, eps);
    },
    drag({ dx, dy }) { this.x += dx; this.y += dy },
});

g2.prototype.lin.prototype = g2.mix(g2.labelIfc, g2.markIfc, {
    // p1 vector notation !
    get p1() { return { x1: this.x1, y1: this.y1 }; },  // relevant if 'p1' is *not* explicite given. 
    get x1() { return Object.getOwnPropertyDescriptor(this, 'p1') ? this.p1.x : 0; },
    get y1() { return Object.getOwnPropertyDescriptor(this, 'p1') ? this.p1.y : 0; },
    set x1(q) { if (Object.getOwnPropertyDescriptor(this, 'p1')) this.p1.x = q; },
    set y1(q) { if (Object.getOwnPropertyDescriptor(this, 'p1')) this.p1.y = q; },
    // p2 vector notation !
    get p2() { return { x2: this.x2, y2: this.y2 }; },  // relevant if 'p2' is *not* explicite given. 
    get x2() { return Object.getOwnPropertyDescriptor(this, 'p2') ? this.p2.x : 0; },
    get y2() { return Object.getOwnPropertyDescriptor(this, 'p2') ? this.p2.y : 0; },
    set x2(q) { if (Object.getOwnPropertyDescriptor(this, 'p2')) this.p2.x = q; },
    set y2(q) { if (Object.getOwnPropertyDescriptor(this, 'p2')) this.p2.y = q; },

    isSolid: false,
    get len() { return Math.hypot(this.x2 - this.x1, this.y2 - this.y1); },
    get sh() { return this.state & g2.OVER ? [0, 0, 5, "black"] : false },
    get g2() {      // dynamically switch existence of method via getter ... !
        const e = g2();
        this.label && e.ins(e => this.drawLabel(e));
        this.mark && e.ins(e => this.drawMark(e));
        return () => g2().lin(g2.flatten(this)).ins(e);
    },

    pointAt(loc) {
        let t = loc === "beg" ? 0
            : loc === "end" ? 1
                : (loc + 0 === loc) ? loc // numerical arg ..
                    : 0.5,   // 'mid' ..
            dx = this.x2 - this.x1,
            dy = this.y2 - this.y1,
            len = Math.hypot(dx, dy);
        return {
            x: this.x1 + dx * t,
            y: this.y1 + dy * t,
            nx: len ? dy / len : 0,
            ny: len ? -dx / len : -1
        };
    },
    hit({ x, y, eps }) {
        return g2.isPntOnLin({ x, y }, { x: this.x1, y: this.y1 }, { x: this.x2, y: this.y2 }, eps);
    },
    drag({ dx, dy }) {
        this.x1 += dx; this.x2 += dx;
        this.y1 += dy; this.y2 += dy;
    }
});

g2.prototype.rec.prototype = g2.mix(g2.pointIfc, g2.labelIfc, g2.markIfc, {
    get len() { return 2 * (this.b + this.h); },
    get isSolid() { return this.fs && this.fs !== 'transparent' },
    get lsh() { return this.state & g2.OVER; },
    get sh() { return this.state & g2.OVER ? [0, 0, 5, "black"] : false; },
    get g2() {      // dynamically switch existence of method via getter ... !
        const e = g2();
        this.label && e.ins(e => this.drawLabel(e));
        this.mark && e.ins(e => this.drawMark(e, true));
        return () => g2().rec(g2.flatten(this)).ins(e);
    },
    lbloc: 'c',
    pointAt(loc) {
        const locAt = (loc) => {
            const o = { c: [0, 0], e: [1, 0], ne: [0.95, 0.95], n: [0, 1], nw: [-0.95, 0.95], w: [-1, 0], sw: [-0.95, -0.95], s: [0, -1], se: [0.95, -0.95] };

            if (o[loc]) return o[loc];

            const w = 2 * Math.PI * loc + pi / 4;
            if (loc <= 0.25) return [1 / Math.tan(w), 1];
            if (loc <= 0.50) return [-1, -Math.tan(w)];
            if (loc <= 0.75) return [- 1 / Math.tan(w), -1];
            if (loc <= 1.00) return [1, Math.tan(w)];
        }
        const q = locAt(loc);
        return {
            x: this.x + (1 + q[0]) * this.b / 2,
            y: this.y + (1 + q[1]) * this.h / 2,
            nx: 1 - Math.abs(q[0]) < 0.01 ? q[0] : 0,
            ny: 1 - Math.abs(q[1]) < 0.01 ? q[1] : 0
        };
    },
    hit({ x, y, eps }) {
        return this.isSolid ? g2.isPntInBox({ x, y }, { x: this.x + this.b / 2, y: this.y + this.h / 2, b: this.b / 2, h: this.h / 2 }, eps)
            : g2.isPntOnBox({ x, y }, { x: this.x + this.b / 2, y: this.y + this.h / 2, b: this.b / 2, h: this.h / 2 }, eps);
    },
    drag({ dx, dy }) { this.x += dx; this.y += dy }
});

g2.prototype.arc.prototype = g2.mix(g2.pointIfc, g2.labelIfc, g2.markIfc, {
    get len() { return Math.abs(this.r * this.dw); },
    isSolid: false,
    get angle() { return this.dw / Math.PI * 180; },
    get sh() { return this.state & g2.OVER ? [0, 0, 5, "black"] : false },
    get g2() {      // dynamically switch existence of method via getter ... !
        const e = g2();
        this.label && e.ins(e => this.drawLabel(e));
        this.mark && e.ins(e => this.drawMark(e));
        return () => g2().arc(g2.flatten(this)).ins(e);
    },
    lbloc: 'mid',
    pointAt(loc) {
        let t = loc === "beg" ? 0
            : loc === "end" ? 1
                : loc === "mid" ? 0.5
                    : loc + 0 === loc ? loc
                        : 0.5,
            ang = (this.w || 0) + t * (this.dw || Math.PI * 2), cang = Math.cos(ang), sang = Math.sin(ang), r = loc === "c" ? 0 : this.r;
        return {
            x: this.x + r * cang,
            y: this.y + r * sang,
            nx: cang,
            ny: sang
        };
    },
    hit({ x, y, eps }) { return g2.isPntOnArc({ x, y }, this, eps) },
    drag({ dx, dy }) { this.x += dx; this.y += dy; },
});

/**
* Draw interactive handle.
* @method
* @returns {object} g2
* @param {object} - handle object.
* @property {number} x - x-value center.
* @property {number} y - y-value center.
* @example
* g2().hdl({x:100,y:80})  // Draw handle.
*/
g2.prototype.hdl = function (args) { return this.addCommand({ c: 'hdl', a: args }); }
g2.prototype.hdl.prototype = g2.mix(g2.prototype.cir.prototype, {
    r: 5,
    isSolid: true,
    draggable: true,
    lbloc: 'se',
    get lsh() { return this.state & g2.OVER; },
    get sh() { return this.state & g2.OVER ? [0, 0, 5, "black"] : false },
    g2() {
        const { x, y, r, b = 4, ls = 'black', fs = 'palegreen', sh } = this;
        
        return g2().cir({ x, y, r, ls, fs, sh }).ins((g) => this.label && this.drawLabel(g));
    }
});

/**
* Node symbol.
* @constructor
* @param {object} - symbol arguments object.
* @property {number} x - x-value center.
* @property {number} y - y-value center.
* @example
* g2().nod({x:10,y:10})
*/

g2.prototype.nod = function (args = {}) { return this.addCommand({ c: 'nod', a: args }); }
g2.prototype.nod.prototype = g2.mix(g2.prototype.cir.prototype, {
    r: 5,
    ls: '@nodcolor',
    fs: g2.symbol.nodfill,
    isSolid: true,
    lbloc: 'se',
    g2() {      // in contrast to `g2.prototype.cir.prototype`, `g2()` is called always !
        return g2()
            .cir({ ...g2.flatten(this), r: this.r * (this.scl !== undefined ? this.scl  : 1) })
            .ins((g) => this.label && this.drawLabel(g))
    }
});

/**
 * Double nod symbol
 * @constructor
 * @returns {object} g2
 * @param {object} - symbol arguments object.
 * @property {number} x - x-value center.
 * @property {number} y - y-value center.
 * @example
 * g2().dblnod({x:10,y:10})
*/
g2.prototype.dblnod = function ({ x = 0, y = 0 }) { return this.addCommand({ c: 'dblnod', a: arguments[0] }); }
g2.prototype.dblnod.prototype = g2.mix(g2.prototype.cir.prototype, {
    r: 6,
    isSolid: true,
    g2() {
        return g2()
            .beg({ x: this.x, y: this.y })
            .cir({ r: 6, ls: '@nodcolor', fs: '@nodfill', sh: this.sh })
            .cir({ r: 3, ls: '@nodcolor', fs: '@nodfill2' })
            .end()
            .ins((g) => this.label && this.drawLabel(g));
    }
})

/**
* Pole symbol.
* @constructor
* @returns {object} g2
* @param {object} - symbol arguments object.
* @property {number} x - x-value center.
* @property {number} y - y-value center.
* @example
* g2().pol({x:10,y:10})
*/
g2.prototype.pol = function (args = {}) { return this.addCommand({ c: 'pol', a: args }); }
g2.prototype.pol.prototype = g2.mix(g2.prototype.nod.prototype, {
    g2() {
        return g2()
            .beg(g2.flatten(this))
            .cir({ r: 6, fs: '@fs2' })
            .cir({ r: 2.5, fs: '@ls', ls: 'transparent' })
            .end()
            .ins((g) => this.label && this.drawLabel(g));
    }
})

/**
* Ground symbol.
* @constructor
* @param {object} - arguments object.
* @property {number} x - x-value center.
* @property {number} y - y-value center.
* @example
* g2().gnd({x:10,y:10})
*/
g2.prototype.gnd = function (args = {}) { return this.addCommand({ c: 'gnd', a: args }); }
g2.prototype.gnd.prototype = g2.mix(g2.prototype.nod.prototype, {
    g2() {
        return g2()
            .beg(g2.flatten(this))
            .cir({ x: 0, y: 0, r: 6 })
            .p()
            .m({ x: 0, y: 6 })
            .a({ dw: Math.PI / 2, x: -6, y: 0 })
            .l({ x: 6, y: 0 })
            .a({ dw: -Math.PI / 2, x: 0, y: -6 })
            .z()
            .fill({ fs: g2.symbol.nodcolor })
            .end()
            .ins((g) => this.label && this.drawLabel(g));
    }
})

g2.prototype.nodfix = function (args = {}) { return this.addCommand({ c: 'nodfix', a: args }); }
g2.prototype.nodfix.prototype = g2.mix(g2.prototype.nod.prototype, {
    g2() {
        return g2()
            .beg(g2.flatten(this))
            .p()
            .m({ x: -8, y: -12 })
            .l({ x: 0, y: 0 })
            .l({ x: 8, y: -12 })
            .drw({ fs: g2.symbol.nodfill2 })
            .cir({ x: 0, y: 0, r: this.r })
            .end()
            .ins((g) => this.label && this.drawLabel(g));
    }
})
/**
* @method
* @returns {object} g2
* @param {object} - symbol arguments object.
* @property {number} x - x-value center.
* @property {number} y - y-value center.
* @example
* g2().view({cartesian:true})
 *     .nodflt({x:10,y:10})
*/
g2.prototype.nodflt = function (args = {}) { return this.addCommand({ c: 'nodflt', a: args }); }
g2.prototype.nodflt.prototype = g2.mix(g2.prototype.nod.prototype, {
    g2() {
        return g2()
            .beg(g2.flatten(this))
            .p()
            .m({ x: -8, y: -12 })
            .l({ x: 0, y: 0 })
            .l({ x: 8, y: -12 })
            .drw({ ls: g2.symbol.nodcolor, fs: g2.symbol.nodfill2 })
            .cir({ x: 0, y: 0, r: this.r, ls: g2.symbol.nodcolor, fs: g2.symbol.nodfill })
            .lin({ x1: -9, y1: -19, x2: 9, y2: -19, ls: g2.symbol.nodfill2, lw: 5 })
            .lin({ x1: -9, y1: -15.5, x2: 9, y2: -15.5, ls: g2.symbol.nodcolor, lw: 2 })
            .end()
            .ins((g) => this.label && this.drawLabel(g));
    }
})

/**
* Draw vector arrow.
* @method
* @returns {object} g2
* @param {object} - vector arguments object.
* @property {number} x1 - start x coordinate.
* @property {number} y1 - start y coordinate.
* @property {number} x2 - end x coordinate.
* @property {number} y2 - end y coordinate.
* @example
* g2().vec({x1:50,y1:20,x2:250,y2:120})
*/
g2.prototype.vec = function vec(args) { return this.addCommand({ c: 'vec', a: args }); }
g2.prototype.vec.prototype = g2.mix(g2.prototype.lin.prototype, {
    g2() {
        const { x1, y1, x2, y2, lw = 1, ls = '#000', ld = [], fs = ls || '#000', lc = 'round', lj = 'round', } = this;
        const dx = x2 - x1, dy = y2 - y1, r = Math.hypot(dx, dy);
        const b = 3 * (1 + lw) > r ? r / 3 : (1 + lw);
        const arrowHead = () => g2().p().m({ x: 0, y: 0 }).l({ x: -5 * b, y: b }).a({ dw: -Math.PI / 3, x: -5 * b, y: -b }).z().drw({ ls, fs, lc, lj });
        return g2()
            .beg({ x: x1, y: y1, w: Math.atan2(dy, dx), lc, lj })
            .p().m({ x: 0, y: 0 })
            .l({ x: r - 3 * b, y: 0 })
            .stroke({ ls, lw, ld })
            .use({ grp: arrowHead, x: r, y: 0 })
            .end()
            .ins((g) => this.label && this.drawLabel(g));
    }
});

/**
* Arc as Vector
* @method
* @returns {object} g2
* @param {object} - angular dimension arguments.
* @property {number} x - start x coordinate.
* @property {number} y - start y coordinate.
* @property {number} r - radius
* @property {number} [w=0] - start angle (in radian).
* @property {number} [dw=Math.PI/2] - angular range in radian. In case of positive values it is running counterclockwise with
 *                                       right handed (cartesian) coordinate system.
* @example
* g2().avec({x:100,y:70,r:50,w:pi/3,dw:4*pi/3})
*/
g2.prototype.avec = function avec(args) { return this.addCommand({ c: 'avec', a: args }); }
g2.prototype.avec.prototype = g2.mix(g2.prototype.arc.prototype, {
    g2() {
        const { x, y, r, w, dw = 0, lw = 1, lc = 'round', lj = 'round', ls, fs = ls || "#000", label } = this;
        const b = 3 * (1 + lw) > r ? r / 3 : (1 + lw), bw = 5 * b / r;
        const arrowHead = () => g2().p().m({ x: 0, y: 2 * b }).l({ x: 0, y: -2 * b }).m({ x: 0, y: 0 }).l({ x: -5 * b, y: b })
            .a({ dw: -Math.PI / 3, x: -5 * b, y: -b }).z().drw({ ls, fs });

        return g2()
            .beg({ x, y, w, ls, lw, lc, lj })
            .arc({ r, w: 0, dw })
            .use({
                grp: arrowHead, x: r * Math.cos(dw), y: r * Math.sin(dw),
                w: (dw >= 0 ? dw + Math.PI / 2 - bw / 2 : dw - Math.PI / 2 + bw / 2)
            })
            .end()
            .ins((g) => label && this.drawLabel(g));
    }
});

/**
* Linear Dimension
* @method
* @returns {object} g2
* @param {object} - dimension arguments object.
* @property {number} x1 - start x coordinate.
* @property {number} y1 - start y coordinate.
* @property {number} x2 - end x coordinate.
* @property {number} y2 - end y coordinate.
* @property {number} off - offset.
* @property {boolean} [inside=true] - draw dimension arrows between or outside of ticks.
* @example
*  g2().dim({x1:60,y1:40,x2:190,y2:120})
*/
g2.prototype.dim = function dim(args) { return this.addCommand({ c: 'dim', a: args }); }
g2.prototype.dim.prototype = g2.mix(g2.prototype.lin.prototype, {
    pointAt(loc) {
        const pnt = g2.prototype.lin.prototype.pointAt.call(this, loc);
        if (this.off) {
            pnt.x += this.off * pnt.nx;
            pnt.y += this.off * pnt.ny;
        }
        return pnt;
    },
    g2() {
        const { x1, y1, x2, y2, lw = 1, lc = 'round', lj = 'round', off = 0, inside = true, ls, fs = ls || "#000", label } = this;
        const dx = x2 - x1, dy = y2 - y1, r = Math.hypot(dx, dy);
        const b = 3 * (1 + lw) > r ? r / 3 : (1 + lw);
        const arrowHead = () => g2().p().m({ x: 0, y: 2 * b }).l({ x: 0, y: -2 * b }).m({ x: 0, y: 0 }).l({ x: -5 * b, y: b })
            .a({ dw: -Math.PI / 3, x: -5 * b, y: -b }).z().drw({ ls, fs });
        return g2()
            .beg({ x: x1 + off / r * dy, y: y1 - off / r * dx, w: Math.atan2(dy, dx), ls, fs, lw, lc, lj })
            .lin({ x1: (inside ? 4 * b : 0), y1: 0, x2: (inside ? r - 4 * b : r), y2: 0 })
            .use({ grp: arrowHead, x: r, y: 0, w: (inside ? 0 : Math.PI) })
            .use({ grp: arrowHead, x: 0, y: 0, w: (inside ? Math.PI : 0) })
            .lin({ x1: 0, y1: off, x2: 0, y2: 0 })
            .lin({ x1: r, y1: off, x2: r, y2: 0 })
            .end()
            .ins((g) => label && this.drawLabel(g));
    }
});

/**
* Angular dimension
* @method
* @returns {object} g2
* @param {object} - angular dimension arguments.
* @property {number} x - start x coordinate.
* @property {number} y - start y coordinate.
* @property {number} r - radius
* @property {number} [w=0] - start angle (in radian).
* @property {number} [dw=Math.PI/2] - angular range in radian. In case of positive values it is running counterclockwise with
 *                                       right handed (cartesian) coordinate system.
* @property {boolean} [outside=false] - draw dimension arrows outside of ticks.
* @depricated {boolean} [inside] - draw dimension arrows between ticks.
* @example
* g2().adim({x:100,y:70,r:50,w:pi/3,dw:4*pi/3})
*/
g2.prototype.adim = function adim(args) { return this.addCommand({ c: 'adim', a: args }); }
g2.prototype.adim.prototype = g2.mix(g2.prototype.arc.prototype, {
    g2() {
        const { x, y, r, w, dw, lw = 1, lc = 'round', lj = 'round', ls, fs = ls || "#000", label } = this;
        const b = 3 * (1 + lw) > r ? r / 3 : (1 + lw), bw = 5 * b / r;
        const arrowHead = () => g2().p().m({ x: 0, y: 2 * b }).l({ x: 0, y: -2 * b }).m({ x: 0, y: 0 }).l({ x: -5 * b, y: b })
            .a({ dw: -Math.PI / 3, x: -5 * b, y: -b }).z().drw({ ls, fs });

        const outside = (this.inside !== undefined && this.outside === undefined) ? !this.inside : !!this.outside;  // still support depricated property !

        return g2()
            .beg({ x, y, w, ls, lw, lc, lj })
            .arc({ r, w: 0, dw })
            .use({ grp: arrowHead, x: r, y: 0, w: (!outside && dw > 0 || outside && dw < 0 ? -Math.PI / 2 + bw / 2 : Math.PI / 2 - bw / 2) })
            .use({ grp: arrowHead, x: r * Math.cos(dw), y: r * Math.sin(dw), w: (!outside && dw > 0 || outside && dw < 0 ? dw + Math.PI / 2 - bw / 2 : dw - Math.PI / 2 + bw / 2) })
            .end()
            .ins((g) => label && this.drawLabel(g));
    }
});

/**
* Origin symbol
* @constructor
* @returns {object} g2
* @param {object} - symbol arguments object.
* @property {number} x - x-value center.
* @property {number} y - y-value center.
* @property {number} w - angle in radians.
* @example
* g2().view({cartesian:true})
 *     .origin({x:10,y:10})
*/
g2.prototype.origin = function (args = {}) { return this.addCommand({ c: 'origin', a: args }); }
g2.prototype.origin.prototype = g2.mix(g2.prototype.nod.prototype, {
    lbloc: 'sw',
    g2() {
        const { x, y, w, ls = '#000', lw = 1 } = this;
        return g2()
            .beg({ x, y, w, ls })
            .vec({ x1: 0, y1: 0, x2: 40, y2: 0, lw, fs: '#ccc' })
            .vec({ x1: 0, y1: 0, x2: 0, y2: 40, lw, fs: '#ccc' })
            .cir({ x: 0, y: 0, r: lw + 1, fs: '#ccc' })
            .end()
            .ins((g) => this.label && this.drawLabel(g));
    }
});

g2.prototype.ply.prototype = g2.mix(g2.labelIfc, g2.markIfc, {
    get isSolid() { return this.closed && this.fs && this.fs !== 'transparent'; },
    get sh() { return this.state & g2.OVER ? [0, 0, 5, "black"] : false; },
    // get len() {
    //     let len_itr = 0;
    //     let last_pt = {x:0,y:0};
    //     g2.pntItrOf(this.pts).map(pt => {
    //         len_itr += Math.hypot(pt.x-last_pt.x, pt.y-last_pt.y);
    //         last_pt = pt;
    //     });
    //     return len_itr;
    // },
    pointAt(loc) {
        const t = loc === "beg" ? 0
            : loc === "end" ? 1
                : (loc + 0 === loc) ? loc // numerical arg ..
                    : 0.5,   // 'mid' ..
            pitr = g2.pntItrOf(this.pts),
            pts = [],
            len = [];

        for (let itr = 0; itr < pitr.len; itr++) {
            const next = pitr((itr + 1) % pitr.len);
            pts.push(pitr(itr));
            len.push(Math.hypot(
                next.x - pitr(itr).x,
                next.y - pitr(itr).y));
        }
        this.closed || len.pop();
        const { t2, x, y, dx, dy } = (() => {
            const target = t * len.reduce((a, b) => a + b);
            for (let itr = 0, tmp = 0; itr < pts.length; itr++) {
                tmp += len[itr];
                const next = pitr(itr + 1).x ? pitr(itr + 1) : pitr(0);
                if (tmp >= target) {
                    return {
                        t2: 1 - (tmp - target) / len[itr],
                        x: pts[itr].x,
                        y: pts[itr].y,
                        dx: next.x - pts[itr].x,
                        dy: next.y - pts[itr].y
                    }
                }
            }
        })();
        const len2 = Math.hypot(dx, dy);
        return {
            x: (this.x || 0) + x + dx * t2,
            y: (this.y || 0) + y + dy * t2,
            nx: len2 ? dy / len2 : 1,
            ny: len2 ? dx / len2 : 0,
        };
    },
    hit({ x, y, eps }) {
        return this.isSolid ? g2.isPntInPly({ x: x - this.x, y: y - this.y }, this, eps)   // translational transformation only .. at current .. !
            : g2.isPntOnPly({ x: x - this.x, y: y - this.y }, this, eps);
    },
    drag({ dx, dy }) { this.x += dx; this.y += dy; },
    get g2() {
        const e = g2();
        this.label && e.ins(e => this.drawLabel(e));
        this.mark && e.ins(e => this.drawMark(e, this.closed));
        return () => g2().ply(g2.flatten(this)).ins(e);
    }
});

g2.prototype.use.prototype = {
    // p vector notation !
    get p() { return { x: this.x, y: this.y }; },  // relevant if 'p' is *not* explicite given. 
    get x() { return Object.getOwnPropertyDescriptor(this, 'p') ? this.p.x : 0; },
    get y() { return Object.getOwnPropertyDescriptor(this, 'p') ? this.p.y : 0; },
    set x(q) { if (Object.getOwnPropertyDescriptor(this, 'p')) this.p.x = q; },
    set y(q) { if (Object.getOwnPropertyDescriptor(this, 'p')) this.p.y = q; },

    isSolid: false,
    /*
        hit(at) {
            for (const cmd of this.grp.commands) {
                if (cmd.a.hit && cmd.a.hit(at))
                    return true;
            }
            return false;
    },
    
        pointAt: g2.prototype.cir.prototype.pointAt,
    */
};
// complex macros / add prototypes to argument objects

/**
* Draw spline by points.
* Implementing a centripetal Catmull-Rom spline (thus avoiding cusps and self-intersections).
* Using iterator function for getting points from array by index.
* It must return current point object {x,y} or object {done:true}.
* Default iterator expects sequence of x/y-coordinates as a flat array [x,y,...],
* array of [[x,y],...] arrays or array of [{x,y},...] objects.
* @see https://pomax.github.io/bezierinfo
* @see https://de.wikipedia.org/wiki/Kubisch_Hermitescher_Spline
* @method
* @returns {object} g2
* @param {object} - spline arguments object.
* @property {object[] | number[][] | number[]} pts - array of points.
* @property {bool} [closed=false] - closed spline.
* @example
* g2().spline({pts:[100,50,50,150,150,150,100,50]})
*/
g2.prototype.spline = function spline({ pts, closed, x, y, w }) {
    arguments[0]._itr = g2.pntItrOf(pts);
    return this.addCommand({ c: 'spline', a: arguments[0] });
}
g2.prototype.spline.prototype = g2.mix(g2.prototype.ply.prototype, {
    g2: function () {
        let { pts, closed, x, y, w, ls, lw, fs, sh } = this, itr = this._itr, gbez;
        if (itr) {
            let b = [], i, n = itr.len,
                p1, p2, p3, p4, d1, d2, d3,
                d1d2, d2d3, scl2, scl3,
                den2, den3, istrf = x || y || w;

            gbez = g2();
            if (istrf) gbez.beg({ x, y, w });
            gbez.p().m(itr(0));
            for (let i = 0; i < (closed ? n : n - 1); i++) {
                if (i === 0) {
                    p1 = closed ? itr(n - 1) : { x: 2 * itr(0).x - itr(1).x, y: 2 * itr(0).y - itr(1).y };
                    p2 = itr(0);
                    p3 = itr(1);
                    p4 = n === 2 ? (closed ? itr(0) : { x: 2 * itr(1).x - itr(0).x, y: 2 * itr(1).y - itr(0).y }) : itr(2);
                    d1 = Math.max(Math.hypot(p2.x - p1.x, p2.y - p1.y), Number.EPSILON);  // don't allow ..
                    d2 = Math.max(Math.hypot(p3.x - p2.x, p3.y - p2.y), Number.EPSILON);  // zero point distances ..
                } else {
                    p1 = p2;
                    p2 = p3;
                    p3 = p4;
                    p4 = (i === n - 2) ? (closed ? itr(0) : { x: 2 * itr(n - 1).x - itr(n - 2).x, y: 2 * itr(n - 1).y - itr(n - 2).y })
                        : (i === n - 1) ? itr(1)
                            : itr(i + 2);
                    d1 = d2;
                    d2 = d3;
                }
                d3 = Math.max(Math.hypot(p4.x - p3.x, p4.y - p3.y), Number.EPSILON);
                d1d2 = Math.sqrt(d1 * d2), d2d3 = Math.sqrt(d2 * d3),
                    scl2 = 2 * d1 + 3 * d1d2 + d2,
                    scl3 = 2 * d3 + 3 * d2d3 + d2,
                    den2 = 3 * (d1 + d1d2),
                    den3 = 3 * (d3 + d2d3);
                gbez.c({
                    x: p3.x, y: p3.y,
                    x1: (-d2 * p1.x + scl2 * p2.x + d1 * p3.x) / den2,
                    y1: (-d2 * p1.y + scl2 * p2.y + d1 * p3.y) / den2,
                    x2: (-d2 * p4.x + scl3 * p3.x + d3 * p2.x) / den3,
                    y2: (-d2 * p4.y + scl3 * p3.y + d3 * p2.y) / den3
                });
            }
            gbez.c(closed ? { x: itr(0).x, y: itr(0).y } : { x: itr(n - 1).x, y: itr(n - 1).y })
            if (closed) gbez.z();
            gbez.drw({ ls, lw, fs, sh });
            if (istrf) gbez.end();
        }
        return gbez;
    }
});
"use strict"

/**
 * @author Pascal Schnabel
 * @license MIT License
 * @requires g2.core.js
 * @requires g2.ext.js
 * @typedef {g2}
 * @description Mechanical extensions. (Requires cartesian coordinates)
 * @returns {g2}
 */

 g2.symbol.nodfill3 = "white";


var g2 = g2 || { prototype:{} };  // for jsdoc only ...

/**
 * Draw fixed node.
 * @method
 * @returns {object} g2
 * @param {object} - node arguments object.
 * @property {number} x -  x coordinate.
 * @property {number} y -  y coordinate.

 * @example
 * g2().nodfix2({x:150,y:75})
 */
g2.prototype.nodfix2 = function () { return this.addCommand({c:'nodfix2',a:arguments[0]}); }
g2.prototype.nodfix2.prototype = g2.mix(g2.prototype.nod.prototype,{
    g2() {
        const t = Object.assign({x:0,y:0,label:{str:'default',loc:'e',off:'2'}}, this);
    
            const w=9;
            const h=12;
            let FG= g2().beg({x:t.x,y:t.y})				
                    .lin({x1: 3, y1:2,x2:w,y2:-h})
                    .lin({x1: -3, y1:2,x2:-w,y2:-h})
                    .lin({x1: -w-5, y1:-h,x2:w+5,y2:-h})
                    .pol2({x:0,y:0,scl:1, fs:"@nodfill3",label:t.label});
            let StepSize=w*2/3;
            for (let i=-w+2; i<w+5; i+=StepSize) {
                let l=6;
                FG.lin({x1:i,y1:-h,x2:i-l,y2:-h-l})
                
            }
            FG.end();
            FG.ins((g) => this.label && this.drawLabel(g));
            return FG;
    }
})
/**
 * Draw parallel line.
 * @method
 * @returns {object} g2
 * @param {object} - node arguments object.
 * @property {number} x1 -  x coordinate.
 * @property {number} y1 -  y coordinate.

 * @example
 * g2().nodfix2({x:150,y:75})
 */
 g2.prototype.parline = function () { return this.addCommand({c:'parline',a:arguments[0]}); }
 g2.prototype.parline.prototype = g2.mix(g2.prototype.lin.prototype,{
    g2() {	
            const	t=Object.assign({ i:2, sz:4, typ:'lin', ls:'@nodcolor', label:{str:'', }},this);
            const {x1=0, sz, typ='lin'}=t;
            const vec={x:t.x2-t.x1,y:t.y2-t.y1};
            const angle=Math.atan2(vec.y,vec.x);//Winkel des Vektors
            const angle2=angle+Math.PI/4;//Winkel senkrechte Markierung
            const laenge=Math.sqrt(vec.x*vec.x+vec.y*vec.y);
            const drw=g2();
            drw.lin({x1: t.x1, y1:t.y1,x2:t.x2,y2:t.y2, ls:t.ls});    
            //drw.lin({x1: t.x1, y1:t.y1,x2:t.x2,y2:t.y2, ls:t.ls,label: t.label});
                        const min=0.49;
                        const max=1-min;
                let StepSize=(max-min)/(t.i-1);
const PM={x:t.x1+laenge/2*Math.cos(angle),y:t.y1+laenge/2*Math.sin(angle)};
                for (let i=min; i<=max; i+=StepSize) {
                    let l=i*laenge;
                    
                    if (typ==='cir'){drw.cir({x:PM.x, y:PM.y, r:sz, ls:t.ls, ld:[1 ,0]})}
                    else{
                        
                        const P1={x:PM.x+sz*Math.cos(angle2),y:PM.y+t.sz*Math.sin(angle2)};
                        const P2={x:PM.x-t.sz*Math.cos(angle2),y:PM.y-t.sz*Math.sin(angle2)};
                        drw.lin({x1:P1.x,y1:P1.y,x2:P2.x,y2:P2.y, ls:t.ls});
                    }              
                    
                }
                drw.ins((g)=> this.label && this.drawLabel(g));
                return drw;
            }
})

/**
 * Draw grd lines like "///""
 * @method
 * @returns {object} g2
 * @param {object} - node arguments object.
 * @property {number} x -  x coordinate.
 * @property {number} y -  y coordinate.
 * @property {number} w -  Angle in radians
 * @property {number} ds -  [distance ,length]
 * @property {number} anz -  number of lines (default:4 )
 * @example
 * g2().nodfix2({x:150,y:75})
 */
 g2.prototype.grdlines = function () { return this.addCommand({c:'grdlines',a:arguments[0]}); }
 g2.prototype.grdlines.prototype = g2.mix(g2.prototype.pol.prototype,{
     g2() {
         const args = Object.assign({x:0,y:0,ds: [8,11], w: 0,lw:1,ls:'black', anz:4, label:{str:'default',loc:'e',off:'2'}}, this);
         const dist=args.ds[0]; //distance between lines
         const len=args.ds[1];//length of one line
         const {w,anz}=args;

         const R={x:Math.cos(w),y:Math.sin(w)};
         const w2=w-Math.PI/4*3; 
         const drw=g2();

         for (let i=0;i<anz; i+=1)
         {
                let x1=args.x+i*dist*Math.cos(w);
                let y1=args.y+i*dist*Math.sin(w);
                let x2=x1+len*Math.cos(w2);
                let y2=y1+len*Math.sin(w2);
                drw.lin({x1:x1,y1:y1,x2:x2,y2:y2,ls:args.ls,lw:args.lw});                
         }
         drw.end();
         
         return drw;
     }
    })

/**
 * Draw grd lines
 * @method
 * @returns {object} g2
 * @param {object} - lin arguments object.
 * @property {number} x -  x coordinate.
 * @property {number} y -  y coordinate.
 *  * @property {string} typ -  typ |out|'mid'
 * @property {array} ds -  [space, length] space=distance between lines; length=length of lines
 * @example
 * g2().nodfix2({x:150,y:75})
 */
 g2.prototype.grdline = function () { return this.addCommand({c:'grdline',a:arguments[0]}); }
 g2.prototype.grdline.prototype = g2.mix(g2.prototype.lin.prototype,{
     g2() {
         const args = Object.assign({x1:0,y1:0,x2:1,y2:1,ds: [8,11],lw:1.5,anz:5, w: 0,typ:'out', label:{str:'default',loc:'mid',off:'3'}}, this);
         const vec={x:args.x2-args.x1,y:args.y2-args.y1};
         const angle=Math.atan2(vec.y,vec.x);//Winkel des Vektors
         const {w,anz}=args;
         const len=Math.sqrt(vec.x*vec.x+vec.y*vec.y);
         const drw=g2().beg({ls:args.ls}).
         lin({x1:args.x1,y1:args.y1,x2:args.x2,y2:args.y2,lw:args.lw*2});
                      //  lin({x1:args.x1,y1:args.y1,x2:args.x2,y2:args.y2,lw:args.lw*2,label:args.label});
         let P1,min;
                      switch (args.typ)
                      {
                          case 'mid':
                             min=(len-8*(anz+1)/2-len/2)/len;
                             P1={x:args.x1+Math.cos(angle)*len*min,y:args.y1+Math.sin(angle)*len*min};
                            drw.grdlines({x:P1.x,y:P1.y,w:angle, ls:args.ls, lw:args.lw,anz:anz});
                            break;

                          case 'full':
                              const space=args.ds[0]; //distance between lines
                              const l=args.ds[1]; //length of lines
                              const w2=angle-Math.PI/4*3; //Winkel der Linien
                              let iEnd=len/(space)-2;
                            for (let i=0;i<iEnd; i+=1)
                            {
                                   let x1=args.x1+(i*space + space)*Math.cos(angle);
                                   let y1=args.y1+(i*space + space)*Math.sin(angle);
                                   let x2=x1+l*Math.cos(w2);
                                   let y2=y1+l*Math.sin(w2);
                                   drw.lin({x1:x1,y1:y1,x2:x2,y2:y2,ls:args.ls,lw:args.lw});                
                            }                            
                            break;
                          default:
                             min=4*3/len;
                             P1={x:args.x1+Math.cos(angle)*len*min,y:args.y1+Math.sin(angle)*len*min};
                            const start2=(len-6*5)/len;
                            const P2={x:args.x1+Math.cos(angle)*len*start2,y:args.y1+Math.sin(angle)*len*start2}
                            drw.grdlines({x:P1.x,y:P1.y,w:angle, ls:args.ls, lw:args.lw});
                            drw.grdlines({x:P2.x,y:P2.y,w:angle, ls:args.ls, lw:args.lw});
                            break;
                      }
         drw.end();
         drw.ins((g)=> this.label && this.drawLabel(g));
         return drw;
     }
    })

/**
 * Draw slider.
 * @method
 * @returns {object} g2
 * @param {object} - slider arguments object.
 * @property {number} x - start x coordinate.
 * @property {number} y - start y coordinate.
 * @property {number} [b=32] - slider breadth.
 * @property {number} [h=16] - slider height.
 * @property {number} [w=0] - rotation.
 * @example
 * g2().slider({x:150,y:75,w:Math.PI/4,b:64,h:32})
 */
 g2.prototype.slider = function () { return this.addCommand({c:'slider',a:arguments[0]}); }
 g2.prototype.slider.prototype = g2.mix(g2.prototype.rec.prototype,{
     g2() {
         const args = Object.assign({b:32,h:16,fs:'white', lw:0.8,label:{str:'default',loc:'ne',off:'15'}}, this);
         return g2()
             .beg({x:args.x,y:args.y,w:args.w,fs:args.fs, lw:args.lw})
             .rec({x:-args.b/2,y:-args.h/2,b:args.b,h:args.h})
             .cir({x:0,y:0,r:args.h*0.41,  fs: '@fs2'})    
             .cir({ r: args.h*0.1, fs: '@ls', ls: 'transparent' })
             .end()
             .cir({x:args.x,y:args.y,r:args.h*0.41,  fs: '@fs2',label: args.label}) ;
     }
 })

/**
* Pole symbol.
* @constructor
* @returns {object} g2
* @param {object} - symbol arguments object.
* @property {number} x - x-value center.
* @property {number} y - y-value center.
* @example
* g2().pol({x:10,y:10})
*/
g2.prototype.pol2 = function (args = {}) { return this.addCommand({ c: 'pol2', a: args }); }
g2.prototype.pol2.prototype = g2.mix(g2.prototype.nod.prototype, {
    
    g2() {
        const input=Object.assign({lw:2.2},this);
        return g2()
            .beg(g2.flatten(this))
            .cir({ r: 6, fs: '@fs2' ,lw:input.lw })
            .cir({ r: 1.2, fs: '@ls', ls: 'transparent',lw:input.lw/2 })
            .end();
            //.ins((g) => this.label && this.drawLabel(g));
    }
})

/**
 * Draw grd lines
 * @method
 * @returns {object} g2
 * @param {object} - lin arguments object.
 * @property {number} x -  x coordinate.
 * @property {number} y -  y coordinate.
 *  * @property {string} typ -  typ |out|'mid'
 * @property {array} ds -  [space, length] space=distance between lines; length=length of lines
 * @example
 * g2().nodfix2({x:150,y:75})
 */
 g2.prototype.guide = function () { return this.addCommand({c:'guide',a:arguments[0]}); }
 g2.prototype.guide.prototype = g2.mix(g2.prototype.lin.prototype,{
     g2() {
         let args,vec,w,len;
         if (this.w===undefined){
             args = Object.assign({x1:0,y1:0,x2:1,y2:1,ds: [8,11],lw:1.5, w: 0,len:50,width:24}, this);
             vec={x:args.x2-args.x1,y:args.y2-args.y1};
             w=Math.atan2(vec.y,vec.x);//Winkel des Vektors
             len=Math.sqrt(vec.x*vec.x+vec.y*vec.y);
         }
         else{
             args = Object.assign({x1:0,y1:0,ds: [8,11],lw:1.5, len:50,width:24}, this);
             w=this.w;//Winkel des Vektors
             vec={x:args.len*Math.cos(w),y:Math.sin(w)*args.len};        
            len=Math.sqrt(vec.x*vec.x+vec.y*vec.y);
            const w2=Math.atan2(vec.y,vec.x);
            console.assert(w2===w,`w ${w*180/Math.PI} != w2 ${w2*180/Math.PI}`);
         }

         
         
         const {x1,y1,width}=args;
         


         //calculate corner Points
         const CP1={x:x1-Math.sin(w)*width/2,y:y1+Math.cos(w)*width/2};
         const CP2={x:CP1.x+vec.x,y:CP1.y+vec.y};
         const CP3={x:x1+Math.sin(w)*width/2,y:y1-Math.cos(w)*width/2};
         const CP4={x:CP3.x+vec.x,y:CP3.y+vec.y};

         //start Drawing
         const drw=g2().beg({ls:args.ls})
                    .grdline({x1:CP2.x,y1:CP2.y,x2:CP1.x,y2:CP1.y,lw:args.lw})
                    .grdline({x1:CP3.x,y1:CP3.y,x2:CP4.x,y2:CP4.y,lw:args.lw})
                    .end();
         return drw;
        
     }
    })


"use strict"
//console.log('g2ExtraSymbols.js loaded');
/**
 * @author Pascal Schnabel
 * @license MIT License
 * @requires g2.core.js
 * @requires g2.ext.js
 */
/**
 * Extended G2 SymbolStyle values.
 * @namespace
 * @property {object} symbol  `g2` symbol namespace.
 * @property {object} [symbol.poldot] Predefined symbol: a little tick
 * @property {string} [symbol.nodfill3=white]    node color.
 */
 g2.symbol = g2.symbol || {};
 g2.symbol.poldot = g2().cir({ x: 0, y: 0, r: 1.32, ls: "transparent",fs:"black" });
 g2.symbol.nodfill3 = "white";
 g2.symbol.pol = g2().cir({ x: 0, y: 0, r: 6, ls: "black", lw:1.5,fs:"white" }).use({grp:'poldot'});


/**
 * @property {object} [symbol.nodfix2] Predefined symbol: FG
 */
g2.symbol.nodfix2=function(){
            const w=9,
             h=12;
             const FG=g2().p().m({x: 3, y:2})
             .l({x: -3, y:2})
             .l({x:-w,y:-h})
             .l({x:w,y:-h})
             .l({x:3,y:2})
             .z()
             .stroke({ls:'black',lw:1.1,fs:'white'});
           				
                    /*FG.lin({x1: 3, y1:2,x2:w,y2:-h})
                    .lin({x1: -3, y1:2,x2:-w,y2:-h})
                    .lin({x1: -w-5, y1:-h,x2:w+5,y2:-h});*/
             const StepSize=w*2/3;
            for (let i=-w+2; i<w+5; i+=StepSize) {
                let l=6;
                FG.lin({x1:i,y1:-h,x2:i-l,y2:-h-l});                
            }
            FG.lin({x1:-w-3,y1:-h,x2:w+3,y2:-h})
            FG.use({grp:'pol'});
            FG.end();
            return FG;
    }

/**
 * @property {object} [symbol.slider] Predefined symbol: slider
 */
 g2.symbol.slider = function () { 
     const sl=g2(); 
    const args = {b:32,h:16,fs:'white', lw:0.8,label:{str:'default',loc:'ne',off:'15'}};
         return g2()
             .rec({x:-args.b/2,y:-args.h/2,b:args.b,h:args.h,fs:'white'})
             .use({grp:"pol"})
             .end();
     }


