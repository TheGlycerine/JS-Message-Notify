
/*
 * MessageNotify
	<div id='messagebox'>
		<div class="iconContainer">
			<img src='{{ MEDIA_URL }}images/bubble_tiny_black3.png' class='icon' />
		</div>
		<div class="textContainer">
			<span class="text" id='messagebox-text'>Information</span>
		</div>
	</div>
 * 
 * title: 'Camera Down',
 *  
 * 		The title that appears in the label. If no title is supplied, the
 * 		first part of the message is used. or a pretermined caption
 *  
 * message: "", 
 * 		
 * 		Long content detailing the message. this is a full HTML content of the
 * 		message. If the message is too long, the information will be truncated
 * 		and reading extended information will produce a popup or extend the 
 * 		message toast
 * readBack "/messages/read/12345"
 * 	
 * 		A url providing a callback if you want an alert the person has read 
 * 		the message A url can be provided. 
 * callback: 'callback'
 * 
 * 		A function callback.
				} 
 */
var MessageNotify = function(){
	
	//The current count of the icon blinker.
	this.iconBlinkCounter = 0
	
	//Monitored element to connect to.
	this.element = null
	/**
	 * naturally build to detect an image with an icon class: $(this).children('img.icon') 
	 * but you may override this  by applying alternative jquery selectors. to the 
	 * iconElement variable  
	 */
	this.iconElement = 'img.icon'
	
	/*
	 * Element defined as the visible message text. 
	 * $(this).children('span.text') is the default
	 */
	this.textElement = 'span.text';
	 
	//Reference to self
	var self = this;
	
	// this.Icon class upon instantiation
	this.icon = null;
	// this.Text class upon instantiation
	this.label = null;
	
	/**
	 * The speed of which most general animation is performed. Such
	 * as open() and close() new text() and so on...
	 */
	this.animationSpeed = 'slow';
	
	// If the title of the message is to long, it should be
	// cut in length to a determined length. (chars)
	// -1 means no concatenation
	this.concatTitle = 26;
	
	/**
	 * This variable is affects upon .open() and .close()
	 */
	this.closed = false; 
	
	/**
	 * Internal memory store for local reference objects
	 * of which will not be externally referenced
	 */
	this.__data = {}
	
	/**
	 * If the messagebox is closed, you can optionally pop the title 
	 * for a number of seconds before the message box closes itself once more.
	 */
	this.popTitle = true
	
	/**
	 * If popTitle is true, after popTitle animation is complete, the messagebox
	 * can automatically close to its previous state. 
	 * If this variable is false, the title will stay and messagebox will
	 * not return to previous state (closed) 
	 */
	this.stickyPopTitle = false
	
	/**
	 * To have the icon constantly blink whilst unread messages exist, apply
	 * the message waiting.
	 * This will blink the icon indefinitely until an action is performed 
	 */
	this.messageWaiting = true;
	
	/*
	 * when hovering over the messagebox, after a certain time, the toast
	 * messages data can automatically drop down.
	 * If this is set to false the message toasts must be called using a different
	 * method.
	 */
	this.hoverToast = true;
	
	// If the element is running an animation
	// Not including the icon blinking.
	this.animating = false;
	
	//The alert text on mouse over
	this.openMessage = null; 'New Messages'; //function
	
	/**
	 * Maximum width the element can be. 
	 * (chars)
	 */
	this.maxWidth = 100;
	
	
	/**
	 * Boolean to determine if the element 
	 * will close itself. or can be closed.
	 */
	this.allowClose = true;
	
	/**
	 * The delay in milliseconds for the amount of time after mouse hover
	 * the toast box should appear. this is not required and it is mainly
	 * for UX experiance  
	 */
	this.hoverToastDelay = 300;
	
	/**
	 * Initial function used as a class construct
	 */
	this.init = function(){
		var args = arguments
		self.element = $(args[0])
		self.icon = new this.Icon()
		self.label = new this.Label()
		
		
		self.element.mouseenter(self.mouseOver)
		self.element.mouseleave(self.mouseOut)
		self.element.click(self.click)
		
		self.me("Say something")
	}
	
	this.__externalClickListener = function() {
		var bool = arguments[0]
		
		if(bool){
			if(!self.__data.externalClickListener) {
				self.__data.externalClickListener = true;
				$('html').click(function(){
					self.collapse();
				});
			}
		} else {
			if(self.__data.externalClickListener) {
				self.__data.externalClickListener = false;
				$('html').unblind('click');
			}
		}
	}
	
	this.animateTo = function(){
		var _push = [self.element]
		//animateTo(element, from, to, callback, animationDataObject, configObject)
		/*
		self.me('animate args', arguments)
		for(var i=0; i < 4; i++){
			self.me(i, _push)
			if(arguments[i])
			{
				if( i == 4) {
					//this will be the config object. Add the parent to it.
					if(typeof(arguments[i]) == 'object') {
						arguments[i]['parent'] = self.element.parent();
					}
				} else {
					_push.push(arguments[i])
				}
				
			} else {
				_push.push(arguments[i])
			}
			
		}
		*/
		self._animateTo.apply(this, [self.element, arguments])	
	}
		
	this.expand = function() {
		self.me("Begin expand")
		//animateTo(from, to, callback, animationDataObject, configObject)
		self.animateTo(null, 400, function(){
			self.me("Expand phase 1 complete")
		}, {}, {'speed': 'fast'})
		
	}
	
	this.collapse = function() {
		this.__externalClickListener(false)
		self.allowClose = true;	
		self.me("Collapse");
		self.close()
	}

	this.click = function(ev) {
		self.expand()
		ev.stopPropagation()
		self.__externalClickListener(true)	
		self.allowClose = false
		
	}
	
	this.width = function(){
		return self.element.width()
	}
	
	this.mouseOver = function(ev) {
		// Only perform this action the first time.
		if(!self.__data.mouseover) {
			// Set it to true as this will be over activated.
			self.__data.mouseover = true;
			
			if(m.animating == false && self.hoverToast == true) {
				var _message = null;
				 
				var _open = Boolean(self.openMessage);
				
				if(_open) {
					if(typeof(self.openMessage) == 'function') {
						_message = String(self.openMessage());
					}else{
						_message = self.openMessage;
					}
				} else {
					
					if(self.__data.concatedTitle) {
						
						//get the length of the full title,
						
						//check to see if its over the max width, 
						//if it is, send a concatenated version to value()
						//else show it.
						//var _textLength = $.textMetrics(self.__data.fullTitle).width
						if(self.__data.fullTitle.length > self.maxWidth) {
							//Make it smaller ...
							_message = self.__data.fullTitle.substring(0, self.__data.fullTitle - self.maxWidth);
						} else {
							_message = self.__data.fullTitle;
						}
					} else {
						_message = self.__data.fullTitle;
					}
				}
				//self.me(_message)
				self.openWithText(_message, function() {
					// Check now if already removed mouse (prettier)
					if(!self.__data.mouseover) {
						//self._forceStopAnimation();
						self.close();
					} else if(self.__data.mouseover) {
						window.setTimeout(function(){
							if(self.__data.mouseover){
								self.expand()
							}else{
								//Nothing
							}
						}, self.hoverToastDelay)
					}
				}, {speed: 'fast'});
			}
			
		}
	}
	
	this.mouseOut = function(ev){
		var preMouseOver = self.__data.mouseover;
		self.__data.mouseover = false;
		
		if(preMouseOver && self.allowClose){
			self.close();
		}
		//Has toast?
			// remove
	}
	
	this._forceStopAnimation = function() {
		self.label.element().stop();
	}
	
	/**
	 * Shuts this message element down to just an icon.
	 * The icon can still flash and you may still have the stretchy 
	 * message pop.
	 */
	this.close = function() {
		var _args = arguments;
		var obj = (_args[1])? _args[1]: {};
		self.me("Close argument 0", _args[0])
		if(!self.closed)
			this.label.fadeOut(function(){
				self.__data.widthBeforeClose = self.label.width()
				self.label.animateTo(self.__data.widthBeforeClose, 0, function(){
					self.closed = true;
					if(_args[0]) {
						_args[0]()
					}
				}, {'padding-right': 0}, obj);
			});
	}
	
	/**
	 * Can be used to negate the .close()
	 */
	this.open = function() {
		var _args = arguments;
		var obj = (_args[1])? _args[1]: {};
		
		if(self.closed) {
			var _w = self.__data.widthBeforeClose
			
			self.label.animateTo(0, _w, function(){
				if(self.icon.blinking) {
					self.icon.off()
				}
				self.closed = false
				self.label.fadeIn()
				if(_args[0]) {
					_args[0]();
				}
			}, {}, obj)
			
		}
	}
	
	
	this.openWithText = function() {
		var _args = arguments
		var cb = (_args[1])? _args[1]: null;
		var obj = (_args[2])? _args[2]: {};
		self.label.value(_args[0], function(){
			self.__data.widthBeforeClose = self.label.width()
			self.open(function(){
				if(cb) cb();
			}, obj);
		});
	}
	
	
	this.openState = function(bool) {
		if(bool) {
			self.open();
		} else {
			self.close();
		}
		
	}
	
	
	this.message = function(data) {
		var title = '';
		var message = '';
		
		if(typeof(data) == 'string') {
			data = {message: data};
		}

		// Use a title if it exists, else use the message;
		var _title = (data['title'])? data['title']: data['message'];

		// If the title length should be applied, find the correct length.
		if(self.concatTitle > 0) { 
			// write a smaller version of the title if required
			title = _title.substring(0, self.concatTitle);
			self.__data.concatedTitle = false;
			self.__data.fullTitle = _title;
			if( _title.length > self.concatTitle) {
				self.__data.concatedTitle = true;
				title += '<span class="hellip">&hellip;</span>';
			}
		} else {
			title = _title;
		}
		
		var blinkRate = 3;
		var _closed = self.closed;
		self.__data.iconBlinking = self.icon.blinking
		
		/**
		 * If self.popSubject: allow the message subject to appear for
		 * a number of seconds 
		 * if the element is closed. 
		 * 
		 * Proceed to close after (if set)
		 */
		if(self.popTitle)
		{
			
			/**
			 * If the element is currently closed, change the value and
			 * open the new value.
			 */
			if(_closed) {
				//self.label.value(title);
				//self.label.hide()
				blinkRate = 5;
				self.label.value(title, function(){
					//self.me("Text is", self.label.value())
					self.__data.widthBeforeClose = self.label.width()
					//self.me("Stored Width", self.__data.widthBeforeClose)
					//self.__data.widthBeforeClose = 20; //self.parentWidth(self.label.element)
					self.open(function(){
						if(self.__data.iconBlinking)
						{
							self.me("Turn off blinking.", self.icon.blinking)
							//self.icon.off()
						}
					});
					
				})
			}
		}
		
		self.icon.blink(blinkRate, function(){
			self.me("Complete Message");
			if(_closed) {
				if(!self.stickyPopTitle) {
					self.close(function(){
						if(self.messageWaiting || self.__data.iconBlinking){
							self.icon.on();
							self.__data.iconBlinking = self.icon.blinking;
						}
					});
				}
			}
			//self.openState(!_closed);
		}, function(element, count){
			if(count == 1) {
				element.label.text(title)
			}
		});
	}
	
	this.blinkMessage = function() {
		console.log("Blink Message MessageNotify")
	}

	/**
	 * Return the width of textMetrics for the parent of the object
	 * referenced 
	 */
	this.parentWidth = function() {
		var w = $.textMetrics($(arguments[0]).parent()).width;
		return w
	}
	

	/**
	 * Measure and resize the box to the width of the given string
	 * 
	 * animateTo(element, to)
	 * animateTo(element, from, to)
	 * animateTo(element, to, callback)
	 * animateTo(element, from, to, callback)
	 * animateTo(element, from, to, callback, animationDataObject, configObject)
	 * 
	 */
	this._animateTo = function(){
		var _args = arguments
		var from = 0;
		var to = 0;
		var callback = null;
		var data = {}
		var _speed = 'slow'
		var element = _args[0];
		var parent = element;
		
		self.me("Final data to animate", arguments)
		
		if(arguments.length == 2) {
			from = element.width()
			to = _args[1]
		} else if(_args.length == 3) {
			from = element.width();
			to = _args[1];
			if(jQuery.isFunction(_args[2])) {
				callback = _args[2]
			} else {
				to = _args[2]
			}
		} else if(_args.length >= 4) {
			from = _args[1]
			to = _args[2]
			callback = _args[3]
			
			if(_args[4]) {
				data = _args[4]		
			}
		}
		
		if(_args[5]){
			_speed = (_args[5]['speed'])? _args[5]['speed']: self.animationSpeed;
			parent = (_args[5]['parent'])? _args[5]['parent']: element;
			//self.me(_args[5], _speed)
		}
		
		var _ = self.me;
		/*
		_('from', from)
		_('to', to)
		_('data', data)
		_('config', _args[5])
		_('element', $(element))
		_('parent', $(parent))
		_('callback', callback)
		*/
		//self.me("Arg length", _args.length, _args )
		//self.me("from", from, 'to', to, 'callback', callback())
		
		element.width(from);
		
		if(from == to){
			callback();
		} else {
			var o = {width: to + 1, 'padding-right': '5px'};
			
			for(d in data){
				o[d] = data[d];	
			}
			self.animating = true;			
			parent.animate(o, _speed, function(){
				self.animating = false;
				if(callback){
					if(typeof(callback) == 'function')
					{
						callback();
						
					}
					else
					{
						self.me("Callback is", callback)
					}
				} 
			});
		}
	}
	
	this.__animateTo_attachParent = function() {
		var _push = []
		//animateTo(element, from, to, callback, animationDataObject, configObject)
		for(var i=0; i < 4; i++){
			self.me(i, _push)
			if(arguments[i])
			{
				if( i == 4) {
					//this will be the config object. Add the parent to it.
					if(typeof(arguments[i]) == 'object') {
						arguments[i]['parent'] = self.element.parent();
					}
				} else {
					_push.push(arguments[i])
				}
				
			} else {
				_push.push(arguments[i])
			}
			
		}
		self._animateTo.apply(this, _push)	
	}
	
	this.Label = function(){
		
		/*
		 * Can the label element contain HTML? 
		 */
		this.allowHtml = true;
		
		/*
		 * This value you should never need to apply yourself.
		 * A simple marker to denote the last write to the label
		 * was inclusive of the 'allowHtml' == true property
		 */
		this.hasHtml = false;
		
		// Blink the text a number of times.
		//this.blink = function(count){}
		
		this.animateTo = function(){
			var _push = [self.label.element()]
			var _args = arguments
			
			for(v in arguments){
				_push.push(arguments[v]) 
			}
			self.me('push', _push)
			
			self.__animateTo_attachParent.apply(this, _push)	
		}
		
		// Permanently change the text to new value
		this.value = function(){
			if(arguments[0])
			{
				if(self.label.allowHtml) {
					$(self.textElement).html(arguments[0])
					self.label.hasHtml = true;
				} else {
					$(self.textElement).text(arguments[0])
					self.label.hasHtml = false;
				}
				
				if(arguments[1])
					arguments[1]()
			}
			
			if(self.label.hasHtml == true) {
				return $(self.textElement).html()
			} else {
				return $(self.textElement).text()
			}
			
		}
		 
		
		/*
		 * Handles the width slightly different to normal measurements.
		 * This will return back the true with of the textMetrics, 
		 * no matter if the label element is hidden or visible.
		 */
		this.width = function() {
				var el = self.label.element();
				var init_hidden = !$(el).is(":visible");
				var r = 0;
				
			if(arguments[0]) {
				$(el).parent().width(arguments[0])
				r =  $(el).parent().width() 
			} else {
				
				/* The element must be visible to count the width of the text.
				 * If the element is currently hidden, display it */
				if(init_hidden) el.show();
				
				//Take the measurement
				var _width = self.parentWidth(el);
				
				/* If the element was hidden, hide it. */
				if(init_hidden) el.hide();
				r = _width;
			}
			
			//self.me("Width is", r)
			return r
		}
		
		/*
		 * Return the text element as a jQuery dom object
		 */
		this.element = function(){
			return $($(self.element).find(self.textElement))
		}
		
		/**
		 * Stretch the entire message box to display the full message title
		 * within the popup.
		 */
		this.showAll = function() {
			//On hover, stretch (dont remove text.)
			// fade hellip.
			//On full size - fast switch text.
		}
		
		this.hide = function(){
			self.__hide(self.label.element())
		}
		
		/**
		 * Apply the text value to the label, using the built 
		 * in animation effect. 
		 * To add text to the label without animation use the '.label.value()'
		 * method
		 */
		this.text = function(){
			var _args = arguments;
			
			// If applying a value
			if(arguments[0]){
				
				/*
				if(self.closed) {
					self.open(function(){
						self.label._changeLabel(_args[0])
					})
				} else {
					self.label._changeLabel(_args[0])
				}
				*/
				self.label._changeLabel.apply(null, _args)
				
			}
			else
			{
				return self.label.value()
			}
		}
			
		this._changeLabel = function() {
			var _args = arguments;
			
			var w1 = self.label.width(); //self.parentWidth(self.label.element)
			if(!self.closed) {
				self.label.fadeOut(function(){
						self.label.value(_args[0], function(){
							var w2 = self.label.width();
							self.label.animateTo(w1, w2, function(){
								self.fadeIn(self.textElement, function(){
									if(_args[1]) _args[1]();
								});
							});
						});
					});
			} else {
				self.label.value(_args[0])
				if(_args[1]) _args[1]()
			}
		}
		
		this.fadeOut = function(callBack){
			self.fadeOut(self.textElement, callBack);		
		}
		
		this.fadeIn = function(callBack) {
			self.fadeIn(self.textElement, callBack);
		}
		
		
		// Temp change to text for a number of seconds
		this.say = function(string){}
	}

	this.Icon = function(){
		this.on = function(){
			//begin blinking
			self.icon._blinking = true;
			callback = null;
			if(arguments[0]) callback = arguments[0];
			this._recursiveBlink(callback);
			return self.icon._blinking;
		}
		
		this.off = function(){
			self.icon._blinking = false;
			return self.icon._blinking;
		}
		
		/**
		 * If this icon is blinking or not.
		 */
		this.blinking = false;
		this._blinking = false;
		
		this._recursiveBlink = function(callback){
			if(self.icon._blinking) {
				self.icon.blink(function(){
					if(callback) callback();
					self.icon._recursiveBlink(callback);
				});				
			}
		}
		
		//Performs a single blink with a callback if required
		// count = 1
		this.blink = function(){
			//if(!self.icon.blinking)
				self.icon._blink.apply(null, arguments)
		}
		
		this._blink = function(){
			var el = self.iconElement
			count = 1
			var callback = null
			
			/**
			 * Passed as argument 2, each time the icon finishes a blink
			 * this function will be called.
			 * 
			 * If you have passed a callback function AND a blink function
			 * both will be called - not necessarily at the same time
			 */
			var blinkCall = null 
			
			if(jQuery.isFunction(arguments[0])) {
				//this becomes a callback
				/*
				 * check if there is a second argument - and this is a function.
				 * If so, the callback from this function becomes the value
				 * of count and the second function will be the callback
				 * 
				 * The callback should accept 2 arguments:
				 * this(self) = Reference to this object 
				 * count = The current blink count 
				 */
				if(arguments[1]){
					if(jQuery.isFunction(arguments[1])) {
						callback = arguments[1]
						count = Number(arguments[0]())
					}
				} else {
					
					callback = arguments[0]
				}
			} else {
				if(arguments[0])
					count = Number(arguments[0])
				
				if(arguments[1]){
					callback = arguments[1]
				}	
			}
			
			if(arguments[2])
			{
				blinkCall = arguments[2]
			}
			
			//self.me("Count is ", count, 'callBack is', callback)
			
			// Perform this action only if the element is not currently 
			// blinking.
			if(!self.icon.blinking)
				self.icon.blinking = true;
				self.fadeOut(el, function(){
					self.fadeIn(el, function(){
						self.iconBlinkCounter++;
						
						if(blinkCall) {
							blinkCall(self, self.iconBlinkCounter)
						} else {
							//self.me("No blinkCall applied, count = ", count)
						} 
						
						
						if (self.iconBlinkCounter >= count)
						{
							self.icon.blinking = false;
							self.iconBlinkCounter = 0
							if(callback) callback()
							return true
						}
						else
						{
							self.icon._blink.apply(null,[count, callback, blinkCall])
						};
						
					});
				});
		}
		
	}

	/**
	 * Performs a jquery animation to fade the 
	 * element
	 */
	this.fadeOut = function() {
		var _args = arguments;
		$(_args[0]).fadeOut('slow');
		self.__fade(_args[0], 'fadeOut', function(){
			if(_args[1]) _args[1](); 
		}, 'slow')
	}
	
	this.fadeIn = function(element) {
		var _args = arguments
		$(_args[0]).fadeOut('fast')
		self.__fade(_args[0], 'fadeIn', function(){
			if(_args[1]) _args[1]();
		}, 'slow')
	}
	/*
	this.animateTo = function(){
		var _args = arguments
		var from = 0;
		var to = 0;
		var callback = null;
		var data = {};
		var _speed = 'slow';
		var element = null;
		
		element = arguments[0];
		
		if(arguments.length == 2) {
			from = self.label.width()
			to = _args[1]
		} else if(_args.length == 3) {
			from = self.label.width();
			to = _args[1];
			
			if(jQuery.isFunction(_args[2])) {
				callback = _args[2]
			} else {
				to = _args[2]
			}
		} else if(_args.length >= 4) {
			from = _args[1]
			to = _args[2]
			callback = _args[3]
			
			if(_args[4]) {
				data = _args[4]		
			}
		}
		
		if(_args[5]){
			_speed = (_args[5]['speed'])? _args[5]['speed']: self.animationSpeed;
			self.me(_args[5], _speed)
		}
		
		//self.me("Arg length", _args.length, _args )
		//self.me("from", from, 'to', to, 'callback', callback())
		
		self.label.width(from);
		
		if(from == to){
			callback();
		} else {
			var o = {width: to + 3, 'padding-right': '5px'};
			
			for(d in data){
				o[d] = data[d];	
			}
			self.animating = true;			
			self.label.element().parent().animate(o, _speed, function(){
				self.animating = false;
				if(callback) callback();
			});
		}
	}
	
	*/
	this.__fade = function() {
		var el = $(arguments[0])
		var func = arguments[1]
		var callback = arguments[2]
		var speed = 'slow'
		if(arguments[3]) {
			speed = arguments[3]
		}
		
		el[func](speed, callback)
	}
	
	this.__hide = function(){
		var el = $(arguments[0])
		el.hide()		
	}
	
	this.me = function(){
		console.log.apply(console, arguments)
	}
	
	this.init.apply(this, arguments)
}

function m() {
	var m = new MessageNotify('#messagebox')
	//m.icon.blink(3)
	/*
	window.setTimeout(function(){
		m.message({title: 'Camera "DVD Player" in Entrance cannot be located', 
				message: "'DVD Player' camera is currently down. Please edit camera settings to update the information for this camera.",
				readBack: "/messages/read/12345",
				callback: null
			});
	}, 1000)
	*/
	return m
}

(function($) {

 $.textMetrics = function(el) {

  var h = 0, w = 0;

  var div = document.createElement('div');
  document.body.appendChild(div);
  $(div).css({
   position: 'absolute',
   left: -1000,
   top: -1000,
   display: 'none'
  });

	if(typeof(el) == 'string') {
		el = "<div>" + el + "</div>";
	}
  $(div).html($(el).html());
  var styles = ['font-size','font-style', 'font-weight', 'font-family','line-height', 'text-transform', 'letter-spacing'];
  $(styles).each(function() {
   var s = this.toString();
   $(div).css(s, $(el).css(s));
  });

  h = $(div).outerHeight();
  w = $(div).outerWidth();

  $(div).remove();

  var ret = {
   height: h,
   width: w
  };

  return ret;
 }

})(jQuery);
