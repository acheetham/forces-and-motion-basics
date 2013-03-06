define( function( require ) {
  "use strict";
  var Strings = require( "i18n!../../../nls/forces-and-motion-basics-strings" );
  var PullerNode = require( "tugofwar/view/PullerNode" );
  var Shape = require( 'SCENERY/Shape' );
  var LayerType = require( 'SCENERY/layers/LayerType' );
  var Scene = require( 'SCENERY/Scene' );
  var Path = require( 'SCENERY/nodes/Path' );
  var Image = require( 'SCENERY/nodes/Image' );
  var Text = require( 'SCENERY/nodes/Text' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var Vector2 = require( 'DOT/Vector2' );
  var SimpleDragHandler = require( 'SCENERY/input/SimpleDragHandler' );
  var Property = require( 'PHETCOMMON/model/property/Property' );
  var arrow = require( 'tugofwar/view/arrow' );
  var ControlPanel = require( 'tugofwar/view/ControlPanel' );
  var KnotNode = require( 'tugofwar/view/KnotNode' );
  var GoButton = require( 'tugofwar/view/GoButton' );
  var red = "red",
      blue = "blue",
      small = "small",
      medium = "medium",
      large = "large";

  function TugOfWarScenery( model, topView ) {
    this.model = model;
    var tugOfWarScenery = this;
    var view = this;
    var getImage = topView.getImage;

    function getPullerImage( puller, leaning ) {
      var type = puller.get( "type" );
      var size = puller.get( "size" );
      var sizeString = size === large ? "_lrg_" :
                       size === medium ? "_" :
                       "_small_";
      var colorString = type.toUpperCase();
      return topView.getImage( "pull_figure" + sizeString + colorString + "_" + (leaning ? 3 : 0) );
    }

    view.model = model;

    this.scene = new Scene( $( "#scene" ), {width: 200, height: 200, allowDevicePixelRatioScaling: true} );
    var grassY = 368;
    this.scene.addChild( new Image( topView.getImage( 'grass' ), {x: 13, y: grassY} ) );
    this.sumArrow = new Path( {shape: new Shape(), fill: '#7dc673', stroke: '#000000', lineWidth: 1} );
    this.model.on( 'change:showSumOfForces', function( m, showSumOfForces ) { view.sumArrow.visible = showSumOfForces; } );
    this.leftArrow = new Path( {shape: new Shape(), fill: '#bf8b63', stroke: '#000000', lineWidth: 1} );
    this.rightArrow = new Path( {shape: new Shape(), fill: '#bf8b63', stroke: '#000000', lineWidth: 1} );
    this.scene.addChild( this.leftArrow );
    this.scene.addChild( this.rightArrow );
    this.scene.addChild( this.sumArrow );

    view.ropeNode = new Image( topView.getImage( 'rope' ), {x: 51, y: 263 } );

    model.knots.each( function( knot ) {
      var knotNode = new KnotNode( knot );
      view.scene.addChild( knotNode );
    } );

    this.scene.addChild( view.ropeNode );
    this.cartNode = new Image( topView.getImage( 'cart' ), {x: 399, y: 221} );
    view.arrowTailX = view.cartNode.centerX;

    this.model.cart.on( 'change:x', function( m, x ) {
      view.cartNode.x = x + 399;
      view.ropeNode.x = x + 51;
    } );

    this.scene.addChild( this.cartNode );
    this.scene.addChild( new GoButton( getImage, this.model ) );

    view.scene.addChild( new Path( {shape: new Shape().moveTo( -10, 10 ).lineTo( 0, 0 ).lineTo( 10, 10 ), stroke: '#000000', lineWidth: 3, x: view.cartNode.centerX, y: grassY + 10} ) );

    //Add toolbox backgrounds for the pullers
    view.scene.addChild( new Path( {shape: Shape.roundRect( 25, 400, 300, 250, 10, 10 ), fill: '#e7e8e9', stroke: '#000000', lineWidth: 1, renderer: 'canvas'} ) );
    view.scene.addChild( new Path( {shape: Shape.roundRect( 623, 400, 300, 250, 10, 10 ), fill: '#e7e8e9', stroke: '#000000', lineWidth: 1, renderer: 'canvas'} ) );

    view.model.pullers.each( function( puller ) {
      puller.on( 'change:x change:y', function( puller ) {
        view.highlightClosestKnot( puller.node );
        view.updateForces();
      } );
      view.scene.addChild( new PullerNode( puller, view.model, getPullerImage( puller, false ), getPullerImage( puller, true ) ) );
    } );

    this.scene.initializeFullscreenEvents(); // sets up listeners on the document with preventDefault(), and forwards those events to our scene
    this.scene.resizeOnWindowResize(); // the scene gets resized to the full screen size

    //Fit to the window and render the initial scene
    $( window ).resize( function() { view.resize(); } );
    this.resize();

    //http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // place the rAF *before* the render() to assure as close to
    // 60fps with the setTimeout fallback.
    (function animloop() {
      requestAnimFrame( animloop );
      model.step();
      view.render();
    })();
  }

  TugOfWarScenery.prototype = {
    resize: function() {
      var width = $( window ).width();
      var height = $( window ).height() - 50;//leave room for the tab bar

      var scale = Math.min( width / 981, height / 644 );

      this.scene.resize( width, height );
      this.scene.setScale( scale );

      var skyHeight = (376) * scale;
      var groundHeight = height - skyHeight;

      //Clear raphael layers and rebuild
      $( "#background" ).empty();

      //Show the sky
      var paper = new Raphael( document.getElementById( "background" ), width - 5, height - 5 );
      var sky = paper.rect( 0, 0, width - 5, height - groundHeight );
      sky.attr( 'fill', '90-#cfecfc-#02ace4' );
      sky.attr( 'stroke', '#fff' );

      //Show the ground
      var ground = paper.rect( 0, height - groundHeight, width, groundHeight );
      ground.attr( 'fill', '#c59a5b' );
      ground.attr( 'stroke', '#fff' );

      var $tabIcons = $( '.tab-icons' );
      $tabIcons.css( {left: width / 2 - $tabIcons.width() / 2, bottom: 3} );
      $( '.icon-home' ).css( {left: width / 2 + $tabIcons.width() / 2, bottom: 3} );

      this.render();
    },
    render: function() {
      this.scene.updateScene();
    },
    //Get the closest knot that is grabbable and within range
    getTargetKnot: function( pullerNode ) {
      var rightType = _.filter( this.knotNodes, function( knot ) {
        return knot.type === pullerNode.puller.get( "type" );
      } );
      var filtered = _.filter( rightType, function( knot ) {return knot.puller === undefined;} );
      if ( filtered.length === 0 ) {
        return null;
      }
      var distance = function( knot ) {
        var dx2 = Math.pow( pullerNode.centerX - knot.centerX, 2 );
        var dy2 = Math.pow( pullerNode.centerY - knot.centerY, 2 );
        return Math.sqrt( dx2 + dy2 );
      };
      var closestAvailable = _.min( filtered, distance );
      return distance( closestAvailable ) < 200 ? closestAvailable : null;
    },
    hideKnots: function() {_.each( this.knotNodes, function( knot ) {knot.visible = false;} );},
    highlightClosestKnot: function( pullerNode ) {
      this.hideKnots();
      var closestKnot = this.getTargetKnot( pullerNode );

      //TODO: why is this sometimes undefined
      if ( closestKnot === undefined || closestKnot == null ) {
      }
      else {
        closestKnot.visible = true;
      }
    },
    updateForces: function() {
      var x = this.arrowTailX;
      var tailWidth = 25;
      var headWidth = 50;
      var headHeight = 40;
      this.leftArrow.shape = arrow( x, 100, x + this.model.getLeftForce(), 100, tailWidth, headWidth, headHeight );
      this.rightArrow.shape = arrow( x, 100, x + this.model.getRightForce(), 100, tailWidth, headWidth, headHeight );
      this.sumArrow.shape = arrow( x, 40, x + this.model.getNetForce(), 40, tailWidth, headWidth, headHeight );
    }
  };

  return TugOfWarScenery;
} );