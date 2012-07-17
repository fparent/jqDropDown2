/******************************************************************
* jQuery prototypal inheritance plugin boilerplate
* Author: Alex Sexton, Scott Gonzalez
* Further changes: @addyosmani
* Licensed under the MIT license
*
*
*******************************************************************/
var DropDownList = {
    
    init: function( options, elem ) {

        // Mix in the passed-in options with the default options
        this.options = $.extend( {}, this.options, options );

        // Save the element reference, both as a jQuery
        // reference and a normal reference
        this.elem  = elem;
        this.$elem = $(elem);

        // First and foremost, check if the select allows multiple selections.
        // If so, overwrite the the size option to 1
        if ( this.elem.multiple ) {
            this.options.size = 1;
            this.options.multiple = true;
        }

        // Save references to every elements of the generated list:
        // the container, the toggle hyperlink and the new list
        this.newList = document.createElement('ul');
        this.dropdown_container = document.createElement('div');
        this.$dropdown_container = $( this.dropdown_container );
        this.toggle_container = document.createElement('div');
        this.trigger = {};

        // Start by hidding the initial select list
        this._hide();

        // Build the DOM's initial structure
        this._buildList();

        // Cache the list object all the options from the generated list
        this.$newList = $( this.newList );
        this.$options = this.$newList.find( '.option' );

        // Sets the height of the new list based on the "size" option
        this._resizeList();

        // Once the new list is build, insert it in the DOM right after
        // the target element
        this._insertInDOM();     

        // Do not bind event on the window and trigger element
        // if it's not a dropdown list
        if ( !this.options.size || this.options.size < 2 ) {
            
            // Bind default events on the new list's elements
            this._bindListEvents();

            // Bind the toggle behavior for the list
            this._bindToggle();
        } else {

            // List doesn't dropdown; still need to bind events on
            // mousedown for the list-items
            this._bindOptionEvents();
        }

        // Initialize the Stroll addon if specified in the user's options
        this._initAddons();

        // return this so that we can chain and use the bridge with less code.
        return this;
    },


    options: {
        // The callback methods that will fire up when the list opens up & closes
        afterClose: function(){},
        beforeOpen: function(){},

        // Allows the user to select an opening direction
        direction: 'down',

        // Available effects for the moment are:
        // default, fade, slide
        effect: 'default',
        effectSpeed: 400,

        // Prevent from closing the dropdown container
        // if the user clicks anywhere but the list
        modal: false,

        // Callback fired up when a new option is selected
        optionChanged: function(){},

        // Can be used to set the value of a valid selector
        // to the selected option of the list.
        // Can be useful in .NET or on form submission
        placeholder: null,

        // Multiple CSS3 effects are available through stroll.js
        // If soemthing is specify, jqDropDown will load the additionnal
        // resources and apply the effect on the list.
        // Available effets are:
        // grow, cards, curl, wave, flip, fly, simplified fly, reverse fly,
        // skew, helix, fan, tilt, papercut, zipper, fade, twirl
        scrollingEffect: 'none',

        // Adds a search input in the generated dropdown list
        // that filters the options and allows a much quicker selection
        search: false,

        // The default label displayed when no search results are found
        search_no_results: 'No results matched',

        // Allows to create stylable lists without dropdown
        size: 1,

        // Apply different styles found in the CSS
        skin: 'default',

        useValue : true
    },


    // Hide the original select list and also assigna  negative tabindex
    // to prevent it from being accessible
    _hide: function() {
       this.$elem.hide().attr( 'tabindex', '-1' );
    },


    _buildList: function() {

        // The array of list-items that will compose the new dropdown list
        var optList = [],

        // Cache the default option because we'll need it later if it's not null
        defaultOption = this.$elem.data('placeholder'),

        // Option tags from the original select list
        originalElems = this.$elem.find('option, optgroup'),

        // Temporary object
        $curItem;


        // A value was found in the data-placeholder property;
        // This will be the pre-selected option of the list and will be inserted before the others.
        // If it's empty, we will automatically select the first item of the list, as per W3C:
        // "The initial state has the first option selected, unless a SELECTED attribute is present
        // on any of the <OPTION> elements."
        // http://www.w3.org/TR/html401/interact/forms.html#edef-OPTGROUP
        if ( defaultOption )  {
            optList.push( this._createOption( defaultOption, 'option active' ) );
        }

        // Loop through all the options of the original select list to dupplicate
        // them as List-Items in the new one. This will make sure they are easily
        // stylable.
        for ( var i = 0; i < originalElems.length; i++ ) {
            $curItem = $(originalElems[i]);

            // Check if the current option is selected; if so, add a styling class
            if( $curItem.is(':selected') && !this.options.defaultOption && !defaultOption ) {
                optList.push( this._createOption( $curItem.text(), 'option active', { nodeType : 'option', val : $curItem.val() } ) );
            }

            // Check the current element's type (only handle option or optgroup) and
            // insert them in the array with the right class.
            else if ( $curItem.is('option') )  {
                optList.push( this._createOption( $curItem.text(), 'option', { nodeType : 'option', val : $curItem.val() } ) );
            }

            else if ( $curItem.is('optgroup') ) {
                optList.push( this._createOption( $curItem.attr('label'), 'optgroup', { type : 'optgroup' } ) );
            }
        }

        // Once the array is filled with every options/optgroups, add it,s content
        // to the newList
        for ( var k = 0; k < optList.length; k++ ) {
            this.newList.appendChild(optList[k]);
        }
    },


    _bindListEvents: function() {

        // As soon as the user mousover something in the list, remove all
        // the active classes
        this.$newList.on( 'mouseenter', $.proxy(function() {
            this._unselectAll();
        }, this ));

        // Add the mouseover event on the selectable list-items that will trigger the styling class
        this.$options.on( 'mouseenter', $.proxy( function( e ) {
            var $this = $( this );

            this._unselectAll();
            $( e.target ).addClass( 'active' );

        }, this ));

    },


    _bindOptionEvents: function() {
        // When the list opens up, add a new listener for a click on an
        // element of the list, which will update the trigger's text
        this.$options.on( 'mousedown.jqDropDown', $.proxy( function( e ) {
            var $this = $( e.target );

            // Prevent the list from closing if an optgroup was clicked
            if ( !$this.hasClass( 'optgroup' ) ) {
                // Put the active class on the clicked element
                this._selectOption( $this );
            }

            
        }, this ));
    },


    _resizeList: function() {
        var visibleElement = this.options.size;

        if ( visibleElement && visibleElement > 1 ) {
            $( this.dropdown_container )
                .addClass( 'list-window' )
                .css({
                    height: 16 * visibleElement,

                    // Add a buffer to the total width for the vertical
                    // scrollbar to prevent a horizontal scrollbar from
                    // displaying
                    width: this.$elem.width() + 17
                });
        }
    },


    _createOption: function( text, classname, data ) {
        var li = document.createElement('li');

        // Set the text for the current node
        li.innerHTML = text;

        if ( typeof classname === 'string' ) {
            li.className = classname;
        }

        // A classname AND a data object, or no classname but
        // just a data object were passed as params
        if ( data || typeof classname === 'object' ) {

            // Make sur the data object is not empty
            for( var prop in data ) {
                
                if( data.hasOwnProperty( prop ) ) {
                    // Change for defineProperty when the compatibility is a little better
                    li.setAttribute( 'data-type', data.nodeType || '' );
                    li.setAttribute( 'data-value', data.val || '' );
                }

            }
        }

        return li;
    },


    _createToggleButton: function( width ) {

        if ( this.options.multiple ) {
            this.trigger = document.createElement('ul');
            this.trigger.className += 'toggle trigger-multiple';
        } else {
            this.trigger = document.createElement('a');
            this.trigger.className += 'toggle trigger-single';
            
            // Generating a href attribute causes problem because we bind
            // the mousedown event to toggle the list. However, because of the href,
            // we need to prevent the default behavior of the "click" event;
            // having both mousedown and click event doesn't respond well.
            this.trigger.setAttribute( 'href', '#' );

            // Set the default value equal to the select elementà
            this.trigger.innerHTML = this.getSelectedOption().text();
        }

        this.trigger.setAttribute( 'data-js', 'toggle-list' );

        // Set the className and automatic width for the toggle container
        this.toggle_container.className += 'toggle-container';
        this.toggle_container.setAttribute( 'style', 'width: ' + width + 'px' );
        this.toggle_container.appendChild( this.trigger );

    },


    _insertInDOM: function() {
        
        // Cache the width
        var width = this.$elem.width();

        // Configure the new list properties
        this.newList.className += 'dropdown-list';
        this.newList.setAttribute( 'style', 'width: ' + width + 'px;' );


        // Check if the size option is specify; if so, we don't need to build
        // a toggle element.
        if ( !this.options.size || this.options.size < 2 ) {
            this._createToggleButton( width );
            this.dropdown_container.className += 'dropdown-window';
        } 

        // Container visible when the toggle link is clicked
        // If the "search" option is set to true, insert
        // a search input plus the new list
        if ( this.options.search ) {
            this.dropdown_container.appendChild( this._buildSearch );
        }

        this.dropdown_container.appendChild( this.newList );


        // The global container that will contain everything
        var container = document.createElement('div');
        container.className += 'list-container';

        // Matches the fake list with the original one via it's name attribute or id
        container.setAttribute( 'data-list', this.elem.getAttribute( 'name' ) || this.elem.id || '' );

        // Add the toggle button only if the number of options 
        // visible is small than 2
        if ( this.options.size < 2 ) {
            container.appendChild( this.toggle_container );
        }

        container.appendChild( this.dropdown_container );

        // Append everything in the DOM next to the target list
        this.$elem.after( container );
    },


    // Returns a DOM selector containing the search input for real-time
    // filtering of the list
    _buildSearch: function() {
        var search_container = document.createElement('div');
        var search_input = document.createElement('input');

        // Switch the input's type to search when compatibility
        // is a little bit better
        search_input.setAttribute( 'type', 'text' );
        search_input.setAttribute( 'accesskey', 'S' );
        search_input.className += 'search-input';

        // Append the search input to it's container and return it
        search_container.className += 'search-container';
        search_container.appendChild( search_input );

        return search_container;
    },


    // Add a click eventListener on the toggle hyperlink that will show/hide
    // the list next to it
    _bindToggle: function() {

        // Toggle the list whenever the user clicks on the trigger element
        $( this.trigger ).on( 'mousedown keydown focusout', $.proxy( function( e ) {

            // Current list lost focus; close it
            if ( e.type === 'focusout' ) {

                // Make sure the list is visible before trying to close it
                if ( this._isListOpened() ) {
                    this.closeList();
                }
            }

            // Mousedown on the list's trigger; toggle it
            if ( e.type === 'mousedown' && e.which === 1 ) {
                this._toggleList();

                // Set the focus on the toggle hyperlink to allow keypress
                $( e.target ).focus();
            }

            if ( e.type === 'keydown' ) {
                this._keypressHandler( e.keyCode, this );
            }

            return false;


        }, this ));
    },


    // In order to reproduce the native behavior of HTML lists,
    // we need to listen of keyboard keypresses to update the
    // trigger's text and list visible state (opened/closed)
    _keypressHandler: function( key, list ) {
        var char = String.fromCharCode( key ).toLowerCase();

        switch ( key ) {

            case 9:  // [TAB]
            case 27: // [Escape]
                list.closeList();
                break;

            case 13: // [ENTER]
                list._selectOption( list.getSelectedOption() );
                list.closeList();
                break;

            case 38:  // [Up]
                this.getSelectedOption()
                    .removeClass( 'active' )
                    .prev( '[data-type="option"]' )
                    .addClass( 'active' );
                break;

            case 40:  // [Down]
                this.getSelectedOption()
                    .removeClass( 'active' )
                    .next( '[data-type="option"]' )
                    .addClass( 'active' );
                break;


            // Check if the key pressed matches the first letter of 
            // an option, and loop through them if multiple
            default:

                // 48 = 0, 90 = z
                if ( key >= 48 && key <= 90 ) {
                    this._activateNextOptStartsWith( char );
                }

                break;
        }
    },


    _initAddons: function() {
        var scrollingOption = this.options.scrollingEffect;

        if ( scrollingOption !== 'none' ) {
            this.newList.className += ' ' + scrollingOption;
            
            // Insert the addon stylesheet to the head section of the page
            $('head').append( '<link>' );

            $("head").children(":last").attr({
                rel:  "stylesheet",
                type: "text/css",
                href: "addons/stroll.min.css"
            });

            // Load the addon script and initialize
            $.getScript( 'addons/stroll.min.js', function() {
                stroll.bind( this.$newList );
            });
        }
    },


    _toggleList: function() {

        // Get the state of the current list: visible or not
        var is_dropdown_visible = this.$dropdown_container.is( ':visible' );

        // Looks like the dropdown window is already visible;
        // Close it and unbind any custom events on the document.
        if ( is_dropdown_visible ) {
            this.closeList();
        }

        // The window was hidden when the user clicked on the toggle link;
        // Show it, then bind a custom event on the document to close
        // the list if the user clicks anywhere else.
        else {
           this.openList();
        }
    },


    // Find a specific list-item in the generated list and returns it's index
    _getOptionIndex: function( $el ) {
        return this.$options.index( $el );
    },


    // Unselect all the options by removing the active class
    _unselectAll: function() {
        this.$options.removeClass( 'active' );
    },


    openList: function() {
        var triggerOptText = $( this.trigger ).text();

        // Call the "beforeOpen" method
        this.options.beforeOpen.call( this );

        // Before showing the list, rebind all the events
        this._bindListEvents();

        // When the list opens up, check to position it correctly.
        // We re-position it every times because the height of the 
        // trigger element may change dynamically
        if ( this.options.direction === 'up' ) {
            this.dropdown_container.style.bottom = $( this.trigger ).outerHeight( true ) + 1 + 'px';
        }

        // Make sure the active element matches the toggle's one.
        // It can be different in the case where the user opens the list,
        // mouse over different options and press escape; the selected 
        // option won't change, but the active class will be apply on the 
        // last hovered item
        this._unselectAll();
        this.$options
            .filter( function(index) { 
                return $(this).text() === triggerOptText; 
            }).addClass( 'active' );


        // Finaly toggle the dowpdown window based on the effect
        switch ( this.options.effect ) {
            
            case 'fade':
                this.$dropdown_container.fadeIn( this.options.effectSpeed, this.openListCallback() );
                break;

            case 'slide':
                this.$dropdown_container.slideToggle( this.options.effectSpeed, this.openListCallback() );
                break;

            default:
                this.$dropdown_container.show( this.openListCallback() );
                break;

        }

        this._bindOptionEvents();
    },


    openListCallback: function() {
        // If the modal option is selected, make sure the user
        // clicks somewhere on the list to close it
        var canvas = window;

        if ( this.options.modal ) {
            canvas = this.newList;
        } 

        // Clicking anywhere in the document should close the list
        // Also, use Namespaced Events to prevent breaking anything
        // already attached to the document when we'll unbind
        $( canvas ).on( 'mousedown.jqDropDown', $.proxy( function( e ) {
            var $this = $( e.target );

            // Prevent the list from closing if an optgroup was clicked
            if ( !$this.hasClass( 'optgroup' ) ) {
                this.closeList();
            }
        }, this ));

    },


    closeList: function() {

        // Unbind the unecessary events now that the list is hidden
        this.$newList.off( 'mousenter' );
        this.$options.off( 'mousedown.jqDropDown' );
        $( window ).off( 'mousedown.jqDropDown' );

        // Make sure to unbind the click event on the list if the
        // modal option is selected (instead of window)
        if ( this.options.modal ) {
            $( this.newList ).off( 'mousedown.jqDropDown' );
        }

        // Finaly toggle the dowpdown window based on the effect
        switch ( this.options.effect ) {
            
            case 'fade':
                this.$dropdown_container.fadeOut( this.options.effectSpeed );
                break;

            case 'slide':
                this.$dropdown_container.slideToggle( this.options.effectSpeed );
                break;

            default:
                this.$dropdown_container.hide();
                break;
        }

        // Remove the unnecessary event binding
        this.$newList.off( 'mouseenter' );


        // Call the "afterToggle" method
        this.options.afterClose.call( this );
    },


    // Simulate a "change" event of a select list by updating the
    // trigger element's text with the selected list-item
    _change: function( val ) {
        $( this.trigger ).text( val );

        // If a valid placeholder container was entered,
        // update it's value when another option is selected
        if ( this.options.placeholder.length ) {
            this.options.placeholder.val( val );
        }
    },


    // Loop throught the valid options (avoiding optgroup) and 
    // returns the next option that starts with the parameter'S letter 
    _activateNextOptStartsWith: function( char ) {
        var curActiveIndex = this._getOptionIndex( this.getSelectedOption() );
        var endOfList = false;

        // Loop from the selected index to the end of the list
        for ( var i = curActiveIndex + 1; i < this.$options.length; i++ ) {
            if ( this.$options.eq( i ).text().charAt( 0 ).toLowerCase() === char ) {
                this._selectOption( this.$options.eq( i ) );
                return;
            }
        }

        // If an option wasn't found from the selected index to the end of the list,
        // start at the beginning of the list up until the selected index to 
        // complete the full loop
        for ( var k = 0; k < curActiveIndex; k++ ) {
            if ( this.$options.eq( k ).text().charAt( 0 ).toLowerCase() === char ) {
                this._selectOption( this.$options.eq( k ) );
                return;
            }
        }
    },


    // Return true if the dropdown list is currently opened (visible)
    _isListOpened: function() {
        return this.$newList.is( ':visible' );
    },


    // Unselect all the selected options and select just the specified one
    // If the multiple mode is activated, copy the list-item and add it
    // to the toggle's list
    _selectOption: function( $opt ) {
        this._unselectAll();
        this.$options.filter( $opt ).addClass( 'active' );

        if ( this.options.multiple ) {
            $( this.trigger ).append( $opt.addClass( 'search-opt' ) );
        }

        // Update the trigger's value to reflect the changes
        else {
            this._change( $opt.text() );
        }

        // Update the mathing option in the original list. 
        // This way, if the form is submitted, the right values
        // will be sent.
        this._updateOriginalList( $opt.text() );

        // Call the "optionChanged" method
        this.options.optionChanged.call( this );
    },


    // Compare text of the selected list-items with the options
    // text in the original list and add the HTML selected value
    // on the found result
    _updateOriginalList: function( val ) {
        this.$elem.find('option').each(function(){
            var $this = $(this);

            if ( $this.text() == val ) {
                $this.prop( 'selected', true );
                return;
            }
        });
    },


    getSelectedOption: function() {
        return this.$options.filter( '.active:eq(0)' );
    },


    // Returns the number of option in the list, excluding the optgroup
    getNbOptions: function() {
        return this.$options.length;
    },


    myMethod: function( msg ){
        // You have direct access to the associated and cached
        // jQuery element
        console.log('myMethod triggered');
        // this.$elem.append('<p>'+msg+'</p>');
    }

};


// Object.create support test, and fallback for browsers without it
if ( typeof Object.create !== 'function' ) {
    Object.create = function (o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}


$(function() {
    // Start a plugin
    $.fn.jqDropDown = function( options ) {

        // Don't act on absent elements -via Paul Irish's advice
        if ( this.length ) {
            return this.each( function() {
                
                // Create a new speaker object via the Prototypal Object.create
                var myList = Object.create( DropDownList );

                // Run the initialization function of the speaker
                myList.init( options, this ); // `this` refers to the element

                // Save the instance of the speaker object in the element's data store
                $.data( this, 'dropdownlist', myList );
            });
        }

    };
});