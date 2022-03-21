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

