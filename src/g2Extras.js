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

