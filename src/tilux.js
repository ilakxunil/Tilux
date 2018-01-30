/*******************************************************************\

Tilux JS 
file:	tilux.js
ver:	0.0.2
author: Darryl Morris
email:  o0ragman0o AT gmail.com
updated:29-Jan-2018
copyright: 2018

Tilux is a string template engine with reactive data binding suited 
for building client side web applications. 

This software is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
See MIT Licence for further details.
<https://opensource.org/licenses/MIT>.

Release Notes:
* Added 'has' trap to prevent self nested proxies

TODO:
----
* investigate scope polution (particularly in min.js)
* user input sanitation (to lock down 'eval')
* implement revokation
* explore `eval()` exploits

\*******************************************************************/
	
var candleNum = 0;

const nullTplt={w:'',f:{}}

// Proxy handler for nested reactive objects
var luxHandler = {
	get: (target, key) => {
		let ret = target[key];
		if (typeof ret !== 'object') return ret;
		ret._p = target;
		if ('__isLux' in ret) return ret;
		return new Proxy(ret, luxHandler);
	},

	set: (target, key, value) => {
		target[key] = value;
		if(key === '_p' || key === 'cbs') return true;
		do {
			if("cbs" in target) target.cbs.forEach(
				cb => { if(!!cb) cb(value, key, target); }
			);
			target = target._p;
		} while(!!target);
		return true;
	},

	has: (target, key) => {
		if (key === "__isLux") return true;
		return key in target;
	}
}

// A reactive object class
class Lux {
	constructor(target = {}, cbs = []) {
		if(typeof target !== "object") target = {value: target};
		target.cbs = cbs;
		return new Proxy(target, luxHandler);
	}
}

// The 'candle' template rendering class
class Tilux {
	constructor(candle = {w:``, f:{}}, cbs = []) {
		if(candle.f.id === undefined) candle.f.id = `tlx_${candleNum++}`;
		cbs.push(()=>{Tilux.render(`#${candle.f.id}`, candle);})
		return new Lux(candle, cbs);
	}

	// Renders a template to a collection of HTML elements
	static render(s,c) {
		document.querySelectorAll(s).forEach(
			(e)=>{ e.outerHTML= this.l(c); }
		)
	}

	// Binary template selector
	static b(o,a,b) { return this.l(o?a:b); }

	// Recursive template rendering
	static t(l,a) {
		return a.map(
			(e)=>{
				return `${!!l[0]?`<${l[0]}>`:``}${!e.map?e:this.t(l.slice(1),e)}${!!l[0]?`</${l[0]}>`:``}`
			}).join('')
	}
	
	// Template literal renderer
	static l(c) {
		return eval(
			'`'
			+ c.w
			.replace(/@|{\$/g, (f)=>({'@':'c.f.','{$':'${'})[f])
			.replace(/{</g, '${Tilux.b')
			.replace(/{#/g, '${Tilux.t')
			.replace(/{>/g, '${Tilux.l')
			+ '`'
			)
	}
}