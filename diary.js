
String.prototype.capitalize = function() {
  return this.replace(/(^|\s)([a-z])/g, function(m, p1, p2) {
    return p1 + p2.toUpperCase();
  });
};



(function(window) {
  SM = {};
  SM.diary = {};

  SM.diary.DO_LOCK = true
  SM.diary.DONT_LOCK = false
  SM.diary.DO_BOOK = true
  SM.diary.DONT_BOOK = false

  SM.diary.IS_NEW = true
  SM.diary.NOT_NEW = false

  SM.diary.LEFT = -1
  SM.diary.RIGHT = 1
  SM.diary.NONE = 0

  SM.diary.IS_LIFTED = true
  SM.diary.NOT_LIFTED = false

  SM.diary.DO_SHRINK = true
  SM.diary.DONT_SHRINK = false

  SM.diary.DO_NEGATIVE = true
  SM.diary.DONT_NEGATIVE = false

  SM.diary.DRAG_MOVE = 1
  SM.diary.DRAG_LEFT = 2
  SM.diary.DRAG_RIGHT = 3

  SM.diary.init = function(options) {

    var defaults;
    defaults = {};
    this.settings = $.extend({}, defaults, options);
    SM.diary.defaults = {
      blockWidth:100,
      blockHeight:100,
      bookingBlockInMinutes:60*24,
      dayStartTimeInHours:9,
      dayEndTimeInHours:18,
      minimumBookingSizeInBlocks:2,
      maximumBookingSizeInBlocks:10,
      defaultBookingSizeInBlocks:4,
      drawDividerAfterMinutes:360,
      scrollSizeInBlocks:3,
      from:new Date().clearTime(),
      to:new Date().add(30).days()
    };
    SM.diary.settings = $.extend({}, SM.diary.defaults, options);
    SM.diary.today = Date.today()

    SM.diary.loading = false;

    SM.diary.blocks = [];
    SM.diary.vehicles = [];
    SM.diary.bookings = [];
    SM.diary.tempBooking = {};

    SM.diary.tempBookingActive = false;

    SM.diary.scrollLeftMin = 0;
    SM.diary.scrollLeftMax = 0;
    SM.diary.lastScrollLeft = 0;
    SM.diary.scrollStartPos = 0;
    SM.diary.drag = {}

    SM.diary.unavailables = [];

    SM.diary.dynamicCSS = [];
    SM.diary.bind();
    SM.diary.build();
  };

  SM.diary.build = function() {
    SM.diary.blocks = [];

    var from = SM.diary.settings.from.clone()
    var to = SM.diary.settings.to.clone()

    console.log(from + " -> " + to)
    var i = 0
    while (from.compareTo(to) == -1) {
      i+=1;
      startTime = new Date(from.getTime())
      from.add(SM.diary.settings.bookingBlockInMinutes).minutes()
      endTime = new Date(from.getTime()).add(-1).seconds()
      SM.diary.blocks.push({start:startTime,end:endTime})

    }

  };

  SM.diary.draw = function() {

    SM.diary.settings.container.addClass("diary-cannot-select")

    SM.diary.outer = $("<div class='diary-outer'></div>")
    SM.diary.inner = $("<div class='diary-inner'></div>")
    SM.diary.navigation = $("<div class='diary-navigation'></div>")
    SM.diary.menu = $("<div class='diary-menu'></div>")
    SM.diary.menu.header = {}
    SM.diary.menu.header.YE = $("<div class='diary-menu-header diary-menu-header-YE'></div>")
    SM.diary.menu.header.MO = $("<div class='diary-menu-header diary-menu-header-MO'></div>")
    SM.diary.menu.header.DA = $("<div class='diary-menu-header diary-menu-header-DA'></div>")
    SM.diary.menu.header.HO = $("<div class='diary-menu-header diary-menu-header-HO'></div>")
    SM.diary.menu.header.MI = $("<div class='diary-menu-header diary-menu-header-MI'></div>")
    
    SM.diary.menu.items = $("<div class='diary-menu-items'></div>")
    SM.diary.calendar = $("<div class='diary-calendar'></div>")
    SM.diary.calendar.header = {}
    SM.diary.calendar.header.YE = $("<div class='diary-calendar-header diary-calendar-header-YE'></div>")
    SM.diary.calendar.header.MO = $("<div class='diary-calendar-header diary-calendar-header-MO'></div>")
    SM.diary.calendar.header.DA = $("<div class='diary-calendar-header diary-calendar-header-DA'></div>")
    SM.diary.calendar.header.HO = $("<div class='diary-calendar-header diary-calendar-header-HO'></div>")
    SM.diary.calendar.header.MI = $("<div class='diary-calendar-header diary-calendar-header-MI'></div>")
    
    SM.diary.calendar.blocks = $("<div class='diary-calendar-blocks'></div>")
    SM.diary.calendar.dividers = $("<div class='diary-calendar-dividers'></div>")
    SM.diary.calendar.bookings = $("<div class='diary-calendar-bookings'></div>")
    SM.diary.settings.container.html("")

    SM.diary.settings.container.append (SM.diary.outer)
    SM.diary.outer.append (SM.diary.navigation)
    
    SM.diary.outer.append (SM.diary.inner)

    SM.diary.dynamicCSS.push(".diary-outer .col {width:" + SM.diary.settings.blockWidth + "px;}")
    SM.diary.dynamicCSS.push(".diary-outer .row {height:" + SM.diary.settings.blockHeight + "px;}")
    SM.diary.dynamicCSS.push(".diary-booking    {height:" + SM.diary.settings.blockHeight + "px;}")
    
    SM.diary.outer.append ("<style>" + SM.diary.dynamicCSS.join("\n") + "</style>")

    SM.diary.inner.append (SM.diary.menu)
    SM.diary.inner.append (SM.diary.calendar)
      
    SM.diary.calendar.append (SM.diary.calendar.header.YE)
    SM.diary.calendar.append (SM.diary.calendar.header.MO)
    SM.diary.calendar.append (SM.diary.calendar.header.DA)
    SM.diary.calendar.append (SM.diary.calendar.header.HO)
    SM.diary.calendar.append (SM.diary.calendar.header.MI)
    
    SM.diary.calendar.append (SM.diary.calendar.blocks)
    SM.diary.calendar.append (SM.diary.calendar.bookings)

    SM.diary.menu.append (SM.diary.menu.header.YE)
    SM.diary.menu.append (SM.diary.menu.header.MO)
    SM.diary.menu.append (SM.diary.menu.header.DA)
    SM.diary.menu.append (SM.diary.menu.header.HO)
    SM.diary.menu.append (SM.diary.menu.header.MI)

    SM.diary.menu.append (SM.diary.menu.items)

    // build blocks
    SM.diary.numberOfBlocks = SM.diary.blocks.length
    totalWidth = SM.diary.numberOfBlocks*SM.diary.settings.blockWidth
    SM.diary.calendar.header.YE.width(totalWidth)
    SM.diary.calendar.header.MO.width(totalWidth)
    SM.diary.calendar.header.DA.width(totalWidth)
    SM.diary.calendar.header.HO.width(totalWidth)
    SM.diary.calendar.header.MI.width(totalWidth)
    
    SM.diary.calendar.blocks.width(totalWidth)
    SM.diary.calendar.dividers.width(totalWidth)

    for (b in SM.diary.blocks) {
      
      blockStartsAt = SM.diary.blocks[b].start
      blockEndsAt = SM.diary.blocks[b].end

      // blockEndsAt = SM.diary.blocks[b].add(SM.diary.settings.bookingBlockInMinutes).minutes()
      SM.diary.calendar.header.YE.append ("<div class='block col " + SM.diary.stylesForDate(blockStartsAt) + "' ><span>" + blockStartsAt.toString("yyyy") + "</span></div>")
      SM.diary.calendar.header.MO.append ("<div class='block col " + SM.diary.stylesForDate(blockStartsAt) + "' ><span>" + blockStartsAt.toString("MMM") + "</span></div>")
      SM.diary.calendar.header.DA.append ("<div class='block col " + SM.diary.stylesForDate(blockStartsAt) + "' ><span>" + blockStartsAt.toString("ddd d") + "</span></div>")
      SM.diary.calendar.header.HO.append ("<div class='block col " + SM.diary.stylesForDate(blockStartsAt) + "' ><span>" + blockStartsAt.toString("HH") + "</span></div>")
      SM.diary.calendar.header.MI.append ("<div class='block col " + SM.diary.stylesForDate(blockStartsAt) + "' ><span>" + blockStartsAt.toString("mm") + "</span></div>")

    }


    //draw vehicles
    for (v in SM.diary.vehicles) {
      SM.diary.menu.items.append("<div class='item row' data-id='" + SM.diary.vehicles[v].id + "'><span>" + SM.diary.vehicles[v].description + "</span></div>")
    
      SM.diary.vehicles[v].blocks = $("<div id='blocks_" + SM.diary.vehicles[v].id + "' class='diary-item-blocks'></div>")
      SM.diary.calendar.blocks.append(SM.diary.vehicles[v].blocks)

      SM.diary.vehicles[v].dates = []

      for (b in SM.diary.blocks) {
          
        blockStartsAt = SM.diary.blocks[b].start
        blockEndsAt = SM.diary.blocks[b].end

        cell = $("<div class='cell col row " + SM.diary.stylesForDate(blockStartsAt) + "' data-vehicle='" + v + "' data-date='" + b + "'><span></span></div>")
        SM.diary.vehicles[v].dates.push({idx:b,block:SM.diary.blocks[b],cell:cell,booking_id:undefined,locked:false,unavailable:false,booked:false})

        SM.diary.vehicles[v].blocks.append(cell)
      }
    }

    //draw unavailables 
    for (u in SM.diary.unavailables) {

      for (v in SM.diary.vehicles) {

        for (d in SM.diary.vehicles[v].dates) {
          date = SM.diary.vehicles[v].dates[d]

          if (date.block.start.between(SM.diary.unavailables[u].from, SM.diary.unavailables[u].to)) {
            date.locked = true
            date.unavailable = true
            date.cell.addClass("unavailable locked")

          }
        }
      }      
    }

    //draw bookings
    for (b in SM.diary.bookings) {

      SM.diary.setBooking(SM.diary.bookings[b],SM.diary.NOT_NEW,SM.diary.DO_LOCK,SM.diary.DO_BOOK)
      
      SM.diary.showBooking(SM.diary.bookings[b],SM.diary.NOT_NEW)
      

    }

    // handle scrolling - this has to be here because it doesn't bubble and can't be bound earlier

    SM.diary.scrollLeftMax = Number(SM.diary.calendar.blocks.width()) - Number(SM.diary.calendar.width())

    // scrolling calendar
    SM.diary.calendar.on("scroll", function(event) {
      
      if (!SM.diary.loading) {
        scrollPos = Number($(this).scrollLeft())
        

        scrollingDirection = SM.diary.NONE
        if (scrollPos < SM.diary.lastScrollLeft) scrollingDirection = SM.diary.LEFT
        if (scrollPos > SM.diary.lastScrollLeft) scrollingDirection = SM.diary.RIGHT

        if ((scrollingDirection == SM.diary.LEFT) && (scrollPos < SM.diary.settings.blockWidth)) {
          SM.diary.shiftTime(SM.diary.LEFT)
        }
        else if ((scrollingDirection == SM.diary.RIGHT) && (scrollPos > SM.diary.scrollLeftMax - SM.diary.settings.blockWidth)) {
          SM.diary.shiftTime(SM.diary.RIGHT)
        }

        SM.diary.lastScrollLeft = scrollPos


      }

    })




    SM.diary.loading = false
    
    SM.diary.lastScrollLeft += SM.diary.scrollStartPos 
    SM.diary.calendar.scrollLeft(SM.diary.lastScrollLeft)



  };

  SM.diary.stylesForDate = function(m) {
    var styles = []; 
    if (m.isWeekday()) {}
    else styles.push("wkend")

    n = m.clone()
    n.clearTime()
    if (Date.today().compareTo(n)==0) {
      styles.push("today")
    } 
    return styles.join(" ")
  }

  SM.diary.resetDrag = function() {
    SM.diary.unliftBooking(SM.diary.drag.obj)

    SM.diary.drag = {active:false, booking:undefined, obj:undefined, type:-1, start_x:0, start_y:0, current_x:0, current_y:0}
    SM.diary.hideTempBookingHighlight();
  };

  SM.diary.liftBooking = function(booking) {
    $(".diary-booking-inner",booking).addClass("lifted")
  }

  SM.diary.unliftBooking = function(booking) {
    $(".diary-booking-inner.lifted",SM.diary.settings.container).removeClass("lifted")
  }

  SM.diary.initVehicles = function(vehicles) {
    SM.diary.vehicles = vehicles;
    for (var v in SM.diary.vehicles) {
      SM.diary.vehicles[v].idx = v;
    }
  };
  
  SM.diary.initBookings = function(bookings) {
    SM.diary.bookings = bookings;
    for (var b in SM.diary.bookings) {
      SM.diary.bookings[b].idx = b;
    }
  };

  SM.diary.initUnavailables = function(unavailables) {
    SM.diary.unavailables = unavailables;

  };

  SM.diary.getVehicleOfCell = function(elm) {
    return SM.diary.vehicles[Number(elm.data("vehicle"))]
  };


  SM.diary.getVehicleWithId = function(id) {
    for (v in SM.diary.vehicles) {
      if (SM.diary.vehicles[v].id == id) {
        return SM.diary.vehicles[v]
      }
    }
  };

  SM.diary.getNeighbouringCell = function(cell,colDiff,rowDiff) {
    vehicle_idx = Number(cell.data("vehicle"))
    date_idx = Number(cell.data("date"))

    vehicle_idx = vehicle_idx + rowDiff
    if (vehicle_idx < 0) vehicle_idx = 0
    if (vehicle_idx > SM.diary.vehicles.length-1) vehicle_idx = SM.diary.vehicles.length-1
    vehicle = SM.diary.vehicles[vehicle_idx]

    date_idx = date_idx + colDiff
    if (date_idx < 0) date_idx = 0
    if (date_idx > SM.diary.blocks.length-1) date_idx = SM.diary.blocks.length-1

    return vehicle.dates[date_idx].cell

  };

  SM.diary.previousAvailableDates = function(vehicle,date) {
    for (var i = 0; i < SM.diary.settings.maximumBookingSizeInBlocks; i++) {
      dt = vehicle.dates[date.idx - i]
      if (dt) {
        if (dt.locked) return i-1
      }
      else return i-1
    }
    return SM.diary.settings.maximumBookingSizeInBlocks;
  };

  SM.diary.getNeighbouringDate = function(vehicle,date,distance) {

    var idx = Number(date.idx) + Number(distance)
    if (idx > vehicle.dates.length-1) idx = vehicle.dates.length - 1
    if (idx < 0) idx = 0
    return vehicle.dates[idx]
  }

  SM.diary.nextAvailableDates = function(vehicle,date) {
    for (var i = 0; i < SM.diary.settings.maximumBookingSizeInBlocks; i++) {
      dt = vehicle.dates[Number(date.idx) + Number(i)]
      if (dt) {
        if (dt.locked) return i-1
      }
      else return i-1
    }
    return SM.diary.settings.maximumBookingSizeInBlocks;
  };

  SM.diary.clearTempBooking = function() {
    SM.diary.tempBookingActive = false;
    SM.diary.tempBooking = {};
    SM.diary.hideTempBookingPanel();
    SM.diary.hideTempBookingHighlight();
  }

  SM.diary.hideTempBookingPanel = function() {
    $("div.diary-booking-temp").remove();
  }

  SM.diary.hideTempBookingHighlight = function() {
    //$("div.cell.temp",SM.diary.calendar.blocks).removeClass("temp")
  }

  SM.diary.showHighlightingAtCell = function(elm,doShrink,doNegative,startSize) {

    vehicle = SM.diary.getVehicleOfCell(elm)
    date = vehicle.dates[elm.index()]
    
    prev = SM.diary.previousAvailableDates(vehicle,date)
    next = SM.diary.nextAvailableDates(vehicle,date)

    isSpace = false

    negativeOffsetMax = 1
    if (doNegative) {
      negativeOffsetMax = startSize
    }

    shrinkLimit = 1      //i.e. don't do any shrinking (for moving existing bookings)
    if (doShrink) {
      shrinkLimit = SM.diary.settings.minimumBookingSizeInBlocks
    }
    for (var k=0;k<shrinkLimit;k++) {
      //starting with the default width, try progressively smaller widths until minimum allowed
      for (var i=0;i<negativeOffsetMax;i++) {
        //starting from the current cell - try to fit the width in - otherwise go left one at a time
        toRight = startSize-1-i-k
        if (next>=toRight) {
          toLeft = startSize-(toRight+1+k)
          if (prev>=toLeft) {
            isSpace = true
            start = SM.diary.getNeighbouringDate(vehicle,date,-toLeft)
            if (start) start = start.block.start
            end = SM.diary.getNeighbouringDate(vehicle,date,+toRight)
            if (end) end = end.block.end
            break;
          }
        }
      }
      if (isSpace) break;
    }
    //build new booking object
    if (isSpace) {
      SM.diary.tempBooking = {idx:-1,id:0,vehicle_id:vehicle.id,start:start, end:end, contact:"NEW BOOKING"}
      SM.diary.setBooking(SM.diary.tempBooking,SM.diary.IS_NEW,SM.diary.DONT_LOCK,SM.diary.DONT_BOOK)
      
    }

    return isSpace
  }

  SM.diary.setBooking = function(booking,isNew,doLock,doBook) {

    if (isNew) SM.diary.hideTempBookingHighlight()

    vehicle = SM.diary.getVehicleWithId(booking.vehicle_id)

    start = booking.start
    end = booking.end

    booking.cells = []
    on = false
    for (d in vehicle.dates) {
      if (start.compareTo(vehicle.dates[d].block.start) < 1)   on = true
      if (end.compareTo(vehicle.dates[d].block.start) < 1)     on = false
      if (on) {
        booking.cells.push(vehicle.dates[d].cell)
        
        vehicle.dates[d].booking_id = booking.id

        if (isNew) {
          //vehicle.dates[d].cell.addClass("temp")
        }
        else {
          if (doLock) {
            vehicle.dates[d].locked = true
            vehicle.dates[d].cell.addClass("locked")
          }
          if (doBook) {
            vehicle.dates[d].booked = true
            vehicle.dates[d].cell.addClass("booked")
          }
        }
           
      }
    }

  };


  SM.diary.showBooking = function(booking,isNew) {

    // check to see if this booking already has an object - if so - destroy it.
    existing = $("div.diary-booking[data-booking='" + booking.idx + "']")
    if (existing.size() > 0) {
      existing.remove()
    }

    if (booking.cells[0]) {   //booking has cells in the current view

      vehicle = SM.diary.getVehicleWithId(booking.vehicle_id)

      startX = booking.cells[0].index()
      endX = booking.cells[booking.cells.length-1].index()

      booking = $("<div class='diary-booking' data-booking='" + booking.idx + "'><div class='diary-booking-inner'><a class='hotspot left' href='#'><i></i></a><a class='hotspot right' href='#'><i></i></a><a class='hotspot move' href='#'><i></i></a><span>" + booking.contact + "</span></div></div>")
      booking.css("top",vehicle.idx*SM.diary.settings.blockHeight)  //parameterise height
      booking.css("left",startX*SM.diary.settings.blockWidth)
      booking.css("width",(endX - startX + 1)*SM.diary.settings.blockWidth)
      if (isNew) booking.addClass("diary-booking-temp")
      
      if (SM.diary.drag.active) SM.diary.liftBooking(booking)

      SM.diary.calendar.bookings.append(booking)
    }

  }


  SM.diary.removeBookingFromVehicle = function(booking) {
    vehicle = SM.diary.getVehicleWithId(booking.vehicle_id)
    for (d in vehicle.dates) {
      if (vehicle.dates[d].booking_id == booking.id) {
        vehicle.dates[d].booking_id = undefined;
        vehicle.dates[d].locked = false;
        vehicle.dates[d].booked = false;
        vehicle.dates[d].cell.removeClass("locked").removeClass("booked")
      }
    }
  }


  SM.diary.shiftTime = function(direction) {
    
    moveMinutes = SM.diary.settings.bookingBlockInMinutes * SM.diary.settings.scrollSizeInBlocks
    if (direction == SM.diary.LEFT) moveMinutes = -moveMinutes

    SM.diary.scrollStartPos = SM.diary.settings.scrollSizeInBlocks * SM.diary.settings.blockWidth
    // diff calc for RIGHT
    if (direction == SM.diary.RIGHT) SM.diary.scrollStartPos = -SM.diary.scrollStartPos

    SM.diary.settings.to.add(moveMinutes).minutes()
    SM.diary.settings.from.add(moveMinutes).minutes()
    
    SM.diary.loading = true
    SM.diary.build();
    SM.diary.draw();


  }

  //BINDINGS BINDINGS BINDINGS




  SM.diary.bind = function() {

    // mousever an available cell to show default booking shadow
    $(SM.diary.settings.container).on("mouseover", "div.cell", function(event){

      if (SM.diary.tempBookingActive) {
        //currently placing a new booking - don't do any more hovering
      }
      else if ($(this).hasClass("locked")) {
        //do nothing - can't place here
      }
      else {
        ok = SM.diary.showHighlightingAtCell($(this),SM.diary.DO_SHRINK,SM.diary.DO_NEGATIVE,SM.diary.settings.defaultBookingSizeInBlocks)
        if (!ok) $(this).addClass("nospace")
        else $(this).removeClass("nospace")
      }
    });

    // click a cell to place a new booking at default (or best available) size


    $(SM.diary.settings.container).on("click", "div.cell", function(event){
      console.log("here")
      if (SM.diary.tempBookingActive) {
        SM.diary.clearTempBooking()
      }
      else if ($(this).hasClass("locked")) {
        //do nothing - can't place here
        SM.diary.clearTempBooking()
      }
      else {
        ok = SM.diary.showHighlightingAtCell($(this),SM.diary.DO_SHRINK,SM.diary.DO_NEGATIVE,SM.diary.settings.defaultBookingSizeInBlocks)
        if (ok) {
          SM.diary.showBooking(SM.diary.tempBooking,SM.diary.IS_NEW)
          SM.diary.tempBookingActive = true;
        }
      }
    });

    // start to drag booking HOTSPOT
    $(SM.diary.settings.container).on("mousedown", "div.diary-booking .hotspot", function(event) {
      event.preventDefault()

      if (SM.diary.drag.active) SM.diary.resetDrag()
      SM.diary.drag.obj = $(this).closest("div.diary-booking")

      SM.diary.drag.isTemp = false

      if (SM.diary.drag.obj.hasClass("diary-booking-temp")) {
        SM.diary.drag.isTemp = true
      }
      else if (SM.diary.tempBookingActive) {
        SM.diary.clearTempBooking()
      }

      SM.diary.drag.active = true
      SM.diary.drag.start_x = event.pageX
      SM.diary.drag.start_y = event.pageY
      
      

      SM.diary.drag.obj_x = Number(SM.diary.drag.obj.position().left)
      SM.diary.drag.obj_y = Number(SM.diary.drag.obj.position().top)

      if (!SM.diary.drag.isTemp) {
        SM.diary.drag.booking = SM.diary.bookings[Number(SM.diary.drag.obj.data("booking"))]
        SM.diary.removeBookingFromVehicle(SM.diary.drag.booking)
      }
      else {
        SM.diary.drag.booking = SM.diary.tempBooking
      }

      SM.diary.drag.originalSize = SM.diary.drag.booking.cells.length

      SM.diary.drag.cell = SM.diary.drag.booking.cells[0]

      SM.diary.tempBooking = $.extend({}, SM.diary.drag.booking);  //backup

      SM.diary.tempBookingActive = true;

      if ($(this).hasClass("move")) SM.diary.drag.type = SM.diary.DRAG_MOVE
      if ($(this).hasClass("left")) SM.diary.drag.type = SM.diary.DRAG_LEFT
      if ($(this).hasClass("right")) SM.diary.drag.type = SM.diary.DRAG_RIGHT

      
      SM.diary.showHighlightingAtCell(SM.diary.drag.cell,SM.diary.DONT_SHRINK,SM.diary.DONT_NEGATIVE,SM.diary.drag.booking.cells.length)

      SM.diary.liftBooking(SM.diary.drag.obj)


    });

    //do dragging
    $(SM.diary.settings.container).on("mousemove", "*", function(event) {
      
      if (event.which != 1) {
        //cancel it all
        if (SM.diary.drag.active) SM.diary.resetDrag()
      }
      if (SM.diary.drag.active) {

        SM.diary.removeBookingFromVehicle(SM.diary.drag.booking)
        // event.preventDefault()
        SM.diary.drag.current_x = event.pageX
        SM.diary.drag.current_y = event.pageY

        xDiff = SM.diary.drag.current_x - SM.diary.drag.start_x
        yDiff = SM.diary.drag.current_y - SM.diary.drag.start_y

        bookingLength = SM.diary.drag.booking.cells.length

        xMove = Math.floor((xDiff+(SM.diary.settings.blockWidth/2))/SM.diary.settings.blockWidth)
        yMove = Math.floor((yDiff+(SM.diary.settings.blockHeight/2))/SM.diary.settings.blockHeight)

        var neg
        if (SM.diary.drag.type == SM.diary.DRAG_MOVE) {
          neg = SM.diary.DO_NEGATIVE
        }
        else {
          yMove = 0
          neg = SM.diary.DONT_NEGATIVE
          if (SM.diary.drag.type == SM.diary.DRAG_LEFT) {
            bookingLength = SM.diary.drag.originalSize - xMove
          }
          else {
            bookingLength = SM.diary.drag.originalSize + xMove
            xMove = 0
          }
        }
        if (bookingLength < SM.diary.settings.minimumBookingSizeInBlocks) {
          bookingLength = SM.diary.settings.minimumBookingSizeInBlocks
          if (SM.diary.drag.type == SM.diary.DRAG_RIGHT) xMove = 0
          if (SM.diary.drag.type == SM.diary.DRAG_LEFT) {
            xMove = SM.diary.drag.originalSize - SM.diary.settings.minimumBookingSizeInBlocks
          }
        }
        if (bookingLength > SM.diary.settings.maximumBookingSizeInBlocks) {
          bookingLength = SM.diary.settings.maximumBookingSizeInBlocks
          if (SM.diary.drag.type == SM.diary.DRAG_RIGHT) xMove = 0
          if (SM.diary.drag.type == SM.diary.DRAG_LEFT) {
            xMove = - (SM.diary.settings.maximumBookingSizeInBlocks - SM.diary.drag.originalSize)
          }
        }

        var c = SM.diary.getNeighbouringCell(SM.diary.drag.cell,xMove,yMove)
        


        SM.diary.showHighlightingAtCell(c,SM.diary.DONT_SHRINK,neg,bookingLength)

        SM.diary.drag.booking.vehicle_id = SM.diary.tempBooking.vehicle_id
        SM.diary.drag.booking.start = SM.diary.tempBooking.start
        SM.diary.drag.booking.end = SM.diary.tempBooking.end

        var isNew = SM.diary.drag.isTemp

        SM.diary.setBooking(SM.diary.drag.booking,isNew,SM.diary.DO_LOCK,SM.diary.DO_BOOK)
        SM.diary.showBooking(SM.diary.drag.booking,isNew)

        //autoscroll
        var autoScroll = 0
        if (event.pageX > SM.diary.inner.width() - (SM.diary.calendar.width()/20)) autoScroll = 1
        if (event.pageX < SM.diary.inner.width() - SM.diary.calendar.width() + (SM.diary.calendar.width()/20)) autoScroll = -1
           
        if (autoScroll != 0) {
          autoScroll *= 3
          SM.diary.lastScrollLeft += autoScroll
          SM.diary.calendar.scrollLeft(SM.diary.lastScrollLeft)

          SM.diary.drag.start_x -= autoScroll

        }
      }
    });

    // stop dragging booking
    $(SM.diary.settings.container).on("mouseup", "*", function(event) {
      event.preventDefault()
      if (SM.diary.drag.active) {

        //save changes

        if (!SM.diary.drag.isTemp)  SM.diary.clearTempBooking()


        SM.diary.resetDrag()


        
      }
    });


  };

  
})(window);































$(function() {
  SM.diary.init({
    container: $("#container")
    // from: Date.parse("1-Aug-2013"),
    // to: Date.parse("25-Aug-2013 23:59")
  })



  var vehicles = []
  vehicles.push({id:1,description:"Vehicle 1 asdas asda dsad sdsad adasd dasda sdasdasd asdasdsa dsaasd asdasd asdasdasds adasdsdasd asdasdasdasd dasdasdas dasdasdadas"})
  vehicles.push({id:2,description:"Vehicle 2 adsas dsd sdsd asdas das dasdas dsadasd asdas asdsadasd asdsadas sadas asdasdasd asdsadasdsa dasdsadsa sasadasasddsa dasdasdsadas dsadasdasdsadsas as"})
  vehicles.push({id:3,description:"Vehicle 3"})
  vehicles.push({id:4,description:"Vehicle 4"})
  vehicles.push({id:5,description:"Vehicle 5"})
  vehicles.push({id:6,description:"Vehicle 6"})
  vehicles.push({id:7,description:"Vehicle 7"})
  vehicles.push({id:8,description:"Vehicle 8"})
  vehicles.push({id:9,description:"Vehicle 9"})
  vehicles.push({id:10,description:"Vehicle 10"})

  var bookings = []
  bookings.push({id:1,vehicle_id:3,start:new Date(2013,8,5,0,0,0), end:new Date(2013,8,7,23,59,59), contact:"Mr Pink"})
  bookings.push({id:2,vehicle_id:5,start:new Date(2013,8,10,0,0,0), end:new Date(2013,8,14,23,59,59), contact:"Mrs Green"})
  bookings.push({id:3,vehicle_id:3,start:new Date(2013,8,10,0,0,0), end:new Date(2013,8,12,23,59,59), contact:"Miss Turquoise-Orange"})
  bookings.push({id:4,vehicle_id:4,start:new Date(2013,8,3,9,0,0), end:new Date(2013,8,7,18,59,59), contact:"Mr Purple"})


  var unavailables =[]
  // unavailables.push({from:new Date(2013,7,31,0,0,0),to:new Date(2013,7,31,23,59,59)})
  unavailables.push({from:new Date(2013,8,16,0,0,0),to:new Date(2013,8,18,23,59,59)})


  SM.diary.initVehicles(vehicles)
  SM.diary.initBookings(bookings)
  SM.diary.initUnavailables(unavailables)
  SM.diary.draw()
});

