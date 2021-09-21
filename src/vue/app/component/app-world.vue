<template>
  <layer :name="name" ref="mouse">
    <room v-for="(room, index) in rooms" :key="index"
          :index="index"
          :room="room"
          :objects="room.objects"
          :parent="name"/>
  </layer>
</template>

<script>
  const BUTTON_UP = 87;
  const BUTTON_DOWN = 83;
  const BUTTON_LEFT = 65;
  const BUTTON_RIGHT = 68;
  const BUTTON_SPACE = 32;
  const BUTTON_ESCAPE = 27;
  const RADIAN = Math.PI / 180;

  import room from './include/room'

  export default {
    name: "app-world",
    components: {room},

    data() {
      return {
        settings: {
          mouseLocked: true,
          scrollable: true,
          moving: true,
          acceptCameraPosition: false,

          interval: 1000 / 144,
          timestamp: performance.now()
        },

        keys: {
          available: [
            BUTTON_UP,
            BUTTON_DOWN,
            BUTTON_LEFT,
            BUTTON_RIGHT,
            BUTTON_SPACE,
            BUTTON_ESCAPE
          ],

          pressed: []
        },

        rooms: {
          mainRoom: {
            active: true,
            objects: {
              floor: {
                bottom: {
                  css: {
                    transform: "rotate3d(1, 0, 0, 270deg) translate3d(-600px, 0px, -350px)",
                    width: '1200px',
                    height: '1200px'
                  }
                }
              },
              walls: {
                left: {css: {transform: "rotate3d(0, 1, 0, 270deg) translate3d(0px, 0px, 800px)"}},
                top: {css: {transform: "rotate3d(0, 1, 0, 180deg) translate3d(400px, 0px, 400px)"}},
                right: {css: {transform: "rotate3d(0, 1, 0, 90deg) translate3d(0px, 0px, 0px)"}},
                bottom: {css: {transform: "rotate3d(0, 1, 0, 0deg) translate3d(-400px, 0px, 400px)"}}
              }
            }
          }
        },

        camera: {
          x: -40,
          y: 40,
          z: 0,
          HORIZONTAL: -1,
          VERTICAL: 1,
          modify: 10,
        },

        player: {
          nickname: 'Bob',
          coordinates: {
            mouse: {x: 0, y: 0, z: 0},
            step: {x: 0, y: 0, z: 0}
          },
          speed: {
            value: 0,
            lastTurn: null,
            max: 20,
            min: -8
          },
          jump: {
            value: 0,
            lastTurn: null
          }
        },

        name: 'world',
        havePointerLock:
            'pointerLockElement' in document ||
            'mozPointerLockElement' in document ||
            'webkitPointerLockElement' in document,
      }
    },

    methods: {
      set (name, value) {
        document.body.style.setProperty(`--${name}`, value);
      },

      /**
       * Проверяет, активно ли событие фиксирования курсора мыши
       * @returns {boolean}
       */
      isMouseLocked () {
        return this.$refs.mouse === document.pointerLockElement ||
            this.$refs.mouse === document.mozPointerLockElement ||
            this.$refs.mouse === document.webkitPointerLockElement;
      },

      /**
       * Обработчик клика
       * @returns {boolean}
       */
      click () {
        if (this.isMouseLocked()) {
          document.exitPointerLock();
          return false;
        }

        this.$refs.mouse.requestPointerLock();
      },

      /**
       * Колбек перемещения
       *
       * @param event
       */
      moveCallback (event) {
        const e = event.originalEvent;

        this.player.coordinates.mouse.x += e.movementX
            || e.mozMovementX
            || e.webkitMovementX || 0;

        this.player.coordinates.mouse.y += e.movementY
            || e.mozMovementY
            || e.webkitMovementY || 0;
      },

      /**
       * Колбек нажатия клавиш
       */
      buttonCallback () {
        if (this.settings.moving) {
          let move = 0, rotate = 0;

          if (this.keys.pressed.length > 0) {
            for (let key of this.keys.pressed) {
              /**
               * Вперёд  => move  1
               * Назад   => move -1
               * Налево  => rotate -1
               * Направо => rotate  1
               *
               * Стоим на месте      => move 0 AND rotate 0
               *  ИЛИ вперёд + назад => move   -1 + 1 => 0
               *  ИЛИ влево + вправо => rotate -1 + 1 => 0
               */
              switch (key) {
                case BUTTON_UP:
                  move += 1;
                  break;
                case BUTTON_DOWN:
                  move -= 1;
                  break;
                case BUTTON_LEFT:
                  rotate -= 1;
                  break;
                case BUTTON_RIGHT:
                  rotate += 1;
                  break;
              }
            }
          }

          this.moving(move, rotate);
        }
      },

      /**
       * Перемещает персонажа по карте
       *
       * @param move Number
       * @param rotate Number
       */
      moving (move = 0, rotate = 0) {
        if (move !== 0) {
          if (this.player.speed.lastTurn === null) {
            this.player.speed.lastTurn = performance.now();
          }

          let diff = (performance.now() - this.player.speed.lastTurn) / 1000,
              interval = diff > 1 ? 1 : diff < -1 ? -1 : diff, value = 0;

          if (move === 1) {
            value = this.player.speed.value + Math.pow(interval, 2);
          } else if (move === -1) {
            value = this.player.speed.value - Math.pow(interval, 2);
          }

          this.player.speed.value =
                value > this.player.speed.max ? this.player.speed.max
              : value < this.player.speed.min ? this.player.speed.min : value;
        } else {
          if (this.player.speed.lastTurn !== null) {
            this.player.speed.lastTurn = null;
          }

          if (this.player.speed.value !== 0) {
            if (this.player.speed.value > -1 && this.player.speed.value < 1) {
              this.player.speed.value = 0;
            } else if (this.player.speed.value > 0) {
              this.player.speed.value -= 1.625;
            } else if (this.player.speed.value < 0) {
              this.player.speed.value += 1.625;
            }
          }
        }

        let mouseDeg = (this.player.coordinates.mouse.x / this.camera.modify + 90) % 360,
            deg = mouseDeg + (45 * rotate * move),
            moveX = Math.cos(deg * RADIAN).toFixed(3),
            moveZ = Math.sin(deg * RADIAN).toFixed(3);

        this.player.coordinates.step.x += moveX * this.player.speed.value;
        this.player.coordinates.step.z += moveZ * this.player.speed.value;
      },

      /**
       * Обработчик анимации
       */
      step () {
        // Камере не нужно ограничение
        if (this.isMouseLocked()) {
          this.set('mouse-x', this.camera.HORIZONTAL * this.player.coordinates.mouse.y / this.camera.modify + 'deg');
          this.set('mouse-y', this.camera.VERTICAL * this.player.coordinates.mouse.x / this.camera.modify + 'deg');
          this.set('camera-distance', this.camera.z + 'px');
        }

        let now = performance.now();

        // А вот позицию персонажа следует ограничить
        if ((now - this.settings.timestamp) > this.settings.interval) {
          this.settings.timestamp = now;

          window.requestAnimationFrame(this.buttonCallback);
        }

        this.set('player-pos-x', this.player.coordinates.step.x + 'px');
        this.set('player-pos-y', this.player.coordinates.step.y + 'px');
        this.set('player-pos-z', this.player.coordinates.step.z + 'px');

        window.requestAnimationFrame(this.step);
      },

      /**
       * Отслеживает состояние захвата курсора мыши
       * @returns {boolean}
       */
      changeCallback () {
        if (!this.havePointerLock) {
          console.log('Ваш браузер не поддерживается');
          return false;
        }

        if (!this.isMouseLocked()) {
          $(document).off('mousemove');
          return false;
        }

        $(document).on('mousemove', this.moveCallback);
        window.requestAnimationFrame(this.step);
      },

      /**
       * Обработчик прокрутки мыши
       * @param event
       */
      scrollCallback (event) {
        let original = event.originalEvent;
        this.camera.z -= original.deltaY;

        if (this.camera.z > 900) {
          this.camera.z = 900;
        }
      },

      /**
       * Обработчик нажатия клавиши
       * @param event
       */
      keydownCallback (event) {
        const key = event.originalEvent.which;

        if (this.keys.available.includes(key)) {
          if (!this.keys.pressed.includes(key)) {
            this.keys.pressed.push(key);
          }
        }
      },

      /**
       * Обработчик отжатия клавиши
       * @param event
       */
      keyupCallback (event) {
        const key = event.originalEvent.which;

        if (this.keys.pressed.includes(key)) {
          this.keys.pressed.splice(this.keys.pressed.indexOf(key), 1);
        }
      }
    },

    mounted () {
      if (this.settings.mouseLocked) {
        this.$refs.mouse.requestPointerLock =
            this.$refs.mouse.requestPointerLock ||
            this.$refs.mouse.mozRequestPointerLock ||
            this.$refs.mouse.webkitRequestPointerLock;

        document.exitPointerLock =
            document.exitPointerLock ||
            document.mozExitPointerLock ||
            document.webkitExitPointerLock;

        $(this.$refs.mouse).on('click', this.click);
        $(document).on('pointerlockchange mozpointerlockchange webkitpointerlockchange', this.changeCallback);
        window.requestAnimationFrame(this.step);

        if (this.settings.scrollable) {
          $(document).on('wheel', this.scrollCallback);
        }

        $(document)
            .on('keydown', this.keydownCallback)
            .on('keyup', this.keyupCallback);
      }
    }
  }
</script>