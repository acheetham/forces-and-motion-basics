define( function( require ) {
  "use strict";

  var Image = require( 'SCENERY/nodes/Image' );
  var Text = require( 'SCENERY/nodes/Text' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var Inheritance = require( 'PHETCOMMON/util/Inheritance' );
  var Strings = require( "i18n!../../../nls/forces-and-motion-basics-strings" );

  function GoButton( getImage, model ) {
    var goButtonImage = this;
    Image.call( this, getImage( 'go_up' ), {x: 420, y: 400, cursor: 'pointer'} );
    goButtonImage.addInputListener(
        {
          over: function( event ) {
            goButtonImage.image = getImage( 'go_hover' );
            goButtonImage.invalidateSelf( new Bounds2( 0, 0, goButtonImage.image.width, goButtonImage.image.height ) );
          },
          out: function( event ) {
            goButtonImage.image = getImage( 'go_up' );
            goButtonImage.invalidateSelf( new Bounds2( 0, 0, goButtonImage.image.width, goButtonImage.image.height ) );
          },
          down: function( event ) {
            goButtonImage.image = getImage( 'go_pressed' );
            goButtonImage.invalidateSelf( new Bounds2( 0, 0, goButtonImage.image.width, goButtonImage.image.height ) );
            model.running = !model.running;
          },
          up: function( event ) {
            goButtonImage.image = getImage( 'go_hover' );
            goButtonImage.invalidateSelf( new Bounds2( 0, 0, goButtonImage.image.width, goButtonImage.image.height ) );
          }
        } );

    //Pre create the text icons because dynamically changing text currently 4-1-2013 looks buggy on ipad3
    var goText = new Text( Strings.go, {fontSize: '34px', renderer: 'canvas'} );
    var pauseText = new Text( Strings.pause, {fontSize: '34px', renderer: 'canvas'} );
    var textContainer = new Node( {children: [goText]} );
    textContainer.x = goButtonImage.width / 2 - textContainer.width / 2 - 5;
    textContainer.y = goButtonImage.height / 2 + 7;
    goButtonImage.addChild( textContainer );

    model.on( "change:running change:state change:numberPullersAttached", function() {
      var child = model.running ? pauseText : goText;
      textContainer.children = [child];
      textContainer.x = goButtonImage.width / 2 - child.width / 2 - 5;
      textContainer.y = goButtonImage.height / 2 + 7;

      goButtonImage.visible = model.numberPullersAttached > 0 && model.state !== 'completed';
    } );

    model.trigger( 'change:numberPullersAttached' );
  }

  Inheritance.inheritPrototype( GoButton, Image );

  return GoButton;
} );