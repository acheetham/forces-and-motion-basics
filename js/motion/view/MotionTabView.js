// Copyright 2002-2013, University of Colorado Boulder

/**
 * Main scenery view for the Motion, Friction and Acceleration tabs.
 */
define( function( require ) {
  'use strict';

  var ResetAllButton = require( 'SCENERY_PHET/ResetAllButton' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Image = require( 'SCENERY/nodes/Image' );
  var Text = require( 'SCENERY/nodes/Text' );
  var VBox = require( 'SCENERY/nodes/VBox' );
  var LinearGradient = require( 'SCENERY/util/LinearGradient' );
  var ItemNode = require( 'motion/view/ItemNode' );
  var WaterBucketNode = require( 'motion/view/WaterBucketNode' );
  var PusherNode = require( 'motion/view/PusherNode' );
  var HSlider = require( 'motion/view/HSlider' );
  var Strings = require( 'Strings' );
  var SpeedometerNode = require( 'motion/view/SpeedometerNode' );
  var inherit = require( 'PHET_CORE/inherit' );
  var MotionControlPanel = require( 'motion/view/MotionControlPanel' );
  var MovingBackgroundNode = require( 'motion/view/MovingBackgroundNode' );
  var imageLoader = require( 'imageLoader' );
  var TabView = require( 'JOIST/TabView' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var ReadoutArrow = require( 'common/view/ReadoutArrow' );
  var FAMBFont = require( 'common/view/FAMBFont' );
  var AccelerometerNode = require( 'motion/view/AccelerometerNode' );
  var Property = require( 'AXON/Property' );
  var DerivedProperty = require( 'AXON/DerivedProperty' );

  /**
   * Constructor for the MotionTabView
   * @param {MotionModel} model model for the entire tab
   * @constructor
   */
  function MotionTabView( model ) {
    this.model = model;
    TabView.call( this );
    this.layoutBounds = new Bounds2( 0, 0, 981, 604 );
    var motionTabView = this;
    motionTabView.model = model;

    var width = this.layoutBounds.width;
    var height = this.layoutBounds.height;

    var skyHeight = 362;
    var groundHeight = height - skyHeight;

    model.getSize = function( item ) { return {width: item.view.width, height: item.view.height}; };

    var skyGradient = new LinearGradient( 0, 0, 0, skyHeight ).addColorStop( 0, '#02ace4' ).addColorStop( 1, '#cfecfc' );
    this.model = model;//Wire up so main.js can step the model

    this.skyNode = new Rectangle( -width, -skyHeight, width * 3, skyHeight * 2, {fill: skyGradient} );
    this.groundNode = new Rectangle( -width, skyHeight, width * 3, groundHeight * 2, {fill: '#c59a5b'} );
    this.addChild( this.skyNode );
    this.addChild( this.groundNode );

    this.addChild( new Node( {layerSplit: true} ) );
    this.addChild( new MovingBackgroundNode( model, this.layoutBounds.width / 2 ) );

    //Add toolbox backgrounds for the objects
    var boxHeight = 180;
    this.addChild( new Rectangle( 10, height - boxHeight - 10, 300, boxHeight, 10, 10, {fill: '#e7e8e9', stroke: '#000000', lineWidth: 1, renderer: 'svg'} ) );
    this.addChild( new Rectangle( width - 10 - 300, height - boxHeight - 10, 300, boxHeight, 10, 10, { fill: '#e7e8e9', stroke: '#000000', lineWidth: 1, renderer: 'svg'} ) );

    this.itemNodes = [];

    this.addChild( new PusherNode( model, this.layoutBounds.width ) );

    for ( var i = 0; i < model.items.length; i++ ) {
      var item = model.items[i];
      var Constructor = item.bucket ? WaterBucketNode : ItemNode;
      var itemNode = new Constructor( model, motionTabView, item,
        imageLoader.getImage( item.image ),
        imageLoader.getImage( item.sittingImage || item.image ),
        imageLoader.getImage( item.holdingImage || item.image ),
        model.showMassesProperty );
      this.itemNodes.push( itemNode );

      //Provide a reference from the item model to its view so that view dimensions can be looked up easily
      item.view = itemNode;
      this.addChild( itemNode );
    }

    if ( model.skateboard ) {
      this.addChild( new Image( imageLoader.getImage( 'skateboard.png' ), {centerX: width / 2, y: 315 + 12} ) );
    }

    var arrowScale = 0.3;
    this.sumArrow = new ReadoutArrow( 'Sum of Forces', '#96c83c', this.layoutBounds.width / 2, 230, model.sumOfForcesProperty, model.showValuesProperty, {labelPosition: 'top', arrowScale: arrowScale} );
    model.multilink( ['showForce', 'showSumOfForces'], function( showForce, showSumOfForces ) {motionTabView.sumArrow.visible = showForce && showSumOfForces;} );
    this.sumOfForcesText = new Text( 'Sum of Forces = 0', {pickable: false, font: {font: new FAMBFont( 16, 'bold' )}, centerX: width / 2, y: 200} );
    model.multilink( ['showForce', 'showSumOfForces', 'sumOfForces'], function( showForce, showSumOfForces, sumOfForces ) {motionTabView.sumOfForcesText.visible = showForce && showSumOfForces && !sumOfForces;} );
    this.appliedForceArrow = new ReadoutArrow( 'Applied Force', '#e66e23', this.layoutBounds.width / 2, 280, model.appliedForceProperty, model.showValuesProperty, {labelPosition: 'side', arrowScale: arrowScale} );
    this.frictionArrow = new ReadoutArrow( 'Friction', '#e66e23', this.layoutBounds.width / 2, 280, model.frictionForceProperty, model.showValuesProperty, {labelPosition: 'side', arrowScale: arrowScale} );

    //On the motion tabs, when the 'Friction' label overlaps the force vector it should be displaced vertically
    model.multilink( ['appliedForce', 'frictionForce'], function( appliedForce, frictionForce ) {
      var sameDirection = (appliedForce < 0 && frictionForce < 0) || (appliedForce > 0 && frictionForce > 0);
      motionTabView.frictionArrow.labelPosition = sameDirection ? 'bottom' : 'side';
    } );
    this.addChild( this.sumArrow );
    this.addChild( this.appliedForceArrow );
    this.addChild( this.frictionArrow );
    this.addChild( this.sumOfForcesText );

    var disableText = function( node ) { return function( length ) {node.fill = length === 0 ? 'gray' : 'black';}; };

    var disableLeftProperty = new DerivedProperty( [model.fallenProperty, model.fallenDirectionProperty], function( fallen, fallenDirection ) {
      return fallen && fallenDirection === 'left';
    } );

    var disableRightProperty = new DerivedProperty( [model.fallenProperty, model.fallenDirectionProperty], function( fallen, fallenDirection ) {
      return fallen && fallenDirection === 'right';
    } );

    var sliderLabel = new Text( Strings.appliedForce, {font: new FAMBFont( 22 ), renderer: 'svg', centerX: width / 2, y: 430} );
    var slider = new HSlider( -500, 500, 300, model.appliedForceProperty, model.speedClassificationProperty, disableLeftProperty, disableRightProperty, {zeroOnRelease: true, centerX: width / 2 + 1, y: 535} ).addNormalTicks();

    this.addChild( sliderLabel );
    this.addChild( slider );

    //Position the units to the right of the text box.
    var readout = new Text( '???', {font: new FAMBFont( 22 ), renderer: 'svg'} );
    readout.bottom = slider.top - 15;
    model.appliedForceProperty.link( function( appliedForce ) {
      readout.text = appliedForce.toFixed( 0 ) + ' ' + Strings.newtons; //TODO: i18n message format
      readout.centerX = width / 2;
    } );

    //Make 'Newtons Readout' stand out but not look like a text entry field
    this.textPanelNode = new Rectangle( 0, 0, readout.right - readout.left + 50, readout.height + 4, 10, 10, {fill: 'white', stroke: 'black', lineWidth: 1, centerX: width / 2, top: readout.y - readout.height + 2, renderer: 'svg'} );
    this.addChild( this.textPanelNode );

    this.addChild( readout );

    model.stack.lengthProperty.link( disableText( sliderLabel ) );
    model.stack.lengthProperty.link( disableText( readout ) );
    model.stack.lengthProperty.link( function( length ) { slider.enabled = length > 0; } );

    //Show a line that indicates the center of the layout
//    this.addChild( new Path( {shape: Shape.lineSegment( Layout.width / 2, 0, Layout.width / 2, Layout.height ), stroke: 'black', lineWidth: 1} ) );

    model.showForceProperty.linkAttribute( motionTabView.appliedForceArrow, 'visible' );

    //Create the speedometer.  Specify the location after construction so we can set the 'top'
    var speedometerNode = new SpeedometerNode( model.velocityProperty ).mutate( {x: width / 2, top: 2} );
    model.showSpeedProperty.linkAttribute( speedometerNode, 'visible' );

    //Move away from the stack if the stack getting too high.  No need to record this in the model since it will always be caused deterministically by the model.
    var itemsCentered = new Property( true );
    model.stack.lengthProperty.link( function() {

      //Move both the accelerometer and speedometer if the stack is getting too high, based on the height of items in the stack
      var stackHeightThreshold = 160;
      if ( motionTabView.stackHeight > stackHeightThreshold && itemsCentered.value ) {
        itemsCentered.value = false;
        new TWEEN.Tween( speedometerNode ).to( { centerX: 300}, 400 ).easing( TWEEN.Easing.Cubic.InOut ).start();
        if ( accelerometerNode ) {
          new TWEEN.Tween( accelerometerWithTickLabels ).to( { centerX: 300}, 400 ).easing( TWEEN.Easing.Cubic.InOut ).start();
        }
      }
      else if ( motionTabView.stackHeight <= stackHeightThreshold && !itemsCentered.value ) {
        itemsCentered.value = true;

        new TWEEN.Tween( speedometerNode ).to( { x: width / 2}, 400 ).easing( TWEEN.Easing.Cubic.InOut ).start();
        if ( accelerometerNode ) {
          new TWEEN.Tween( accelerometerWithTickLabels ).to( { centerX: width / 2}, 400 ).easing( TWEEN.Easing.Cubic.InOut ).start();
        }
      }
    } );
    this.addChild( speedometerNode );

    var controlPanel = new MotionControlPanel( model );
    this.addChild( controlPanel );

    var resetButton = new ResetAllButton( model.reset.bind( model ), {renderer: 'svg'} ).mutate( {centerX: controlPanel.centerX, top: controlPanel.bottom + 5} );
    this.addChild( resetButton );

    if ( model.accelerometer ) {

      var accelerometerNode = new AccelerometerNode( model.accelerationProperty );
      var labelAndAccelerometer = new VBox( {pickable: false, spacing: -18, children: [new Text( 'Acceleration', {font: new FAMBFont( 18 )} ), accelerometerNode]} );
      var tickLabel = function( label, tick ) {
        return new Text( label, {pickable: false, font: new FAMBFont( 16 ), centerX: tick.centerX + 7, top: tick.bottom + 30 - 22} );
      };
      var accelerometerWithTickLabels = new Node( {children: [labelAndAccelerometer, tickLabel( '-20', accelerometerNode.ticks[0] ),
        tickLabel( '0', accelerometerNode.ticks[2] ),
        tickLabel( '20', accelerometerNode.ticks[4] )], centerX: width / 2, y: 150} );
      model.showAccelerationProperty.linkAttribute( accelerometerWithTickLabels, 'visible' );

      this.addChild( accelerometerWithTickLabels );
    }

    //After the view is constructed, move one of the blocks to the top of the stack.
    model.viewInitialized( this );
  }

  return inherit( TabView, MotionTabView, {

    /**
     * Get the height of the objects in the stack (doesn't include skateboard)
     */
    get stackHeight() {
      var sum = 0;
      for ( var i = 0; i < this.model.stack.length; i++ ) {
        sum = sum + this.model.stack.at( i ).view.height;
      }
      return sum;
    },
    get topOfStack() {
      var n = this.model.skateboard ? 335 : 360;
      return n - this.stackHeight;
    }
  } );
} );
