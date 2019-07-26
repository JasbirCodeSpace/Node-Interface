var actionSocket = new Rete.Socket('Action');
var dataSocket = new Rete.Socket('Data');

var eventHandlers = {
    list: [],
    remove() {
        this
            .list
            .forEach(h => {
                document.removeEventListener('keydown', h);
            });
        this.list = [];
    },
    add(name, h) {
        document.addEventListener(name, h, false);
        this
            .list
            .push(h);
    }
};



class MessageControl extends Rete.Control {

    constructor(emitter, msg) {
        super();
        this.emitter = emitter;
        // this.template = '<input :value="msg" @input="change($event)"/>';
        

        this.scope = {
            msg,
            change: this.change.bind(this)
        };
    }

    change(e) {
        this.scope.value = +e.target.value;
        this.update();
    }

    update() {
        this.putData('msg', this.scope.value)
        this.emitter.trigger('process');
        this._alight.scan();
    }

    mounted() {
        this.scope.value = this.getData('msg') || 0;
        this.update();
    }

    setValue(val) {
        this.scope.value = val;
        this._alight.scan()
    }
}

class KeydownComponent extends Rete.Component {
  
  constructor(){
    super('Input');
    this.task = {
      outputs: {act: 'option', key: 'output'},
      init(task){
        eventHandlers.remove();
        eventHandlers.add('keydown', function (e) {
          task.run(e.keyCode);
          task.reset();
        });
      }
    }
  }
  
  builder(node) {
    node.addOutput(new Rete.Output('key', 'data', actionSocket,true))
    node.addOutput(new Rete.Output('act', 'algo', dataSocket,true));
  }
  
  worker(node, inputs, data) {

    return {key: data}
  }
}

class EnterPressComponent extends Rete.Component {
  
  constructor(){
    super('Algorithm Applied');
    this.task = {
      outputs: {then:'option', else:'option'}
    }
  }
  
  builder(node) {

    node
      .addInput(new Rete.Input('key','data', actionSocket,true))
      .addInput(new Rete.Input('act', 'action', dataSocket,true))
      .addOutput(new Rete.Output('then', 'success', actionSocket))
      .addOutput(new Rete.Output('else', 'Error', actionSocket));
  }

  worker(node, inputs, outputs) {
    if (inputs['key'][0] == 13) 
      this.closed = ['else'];
    else 
      this.closed = ['then'];

  }
}

class OutputComponent extends Rete.Component {
  
  constructor() {
    super('Output');
    this.task = {
      outputs: {}
    }
  }

  builder(node) {
    var ctrl = new MessageControl(this.editor, node.data.msg);
    
    node
      .addControl(ctrl)
      .addInput(new Rete.Input('act', '', actionSocket,true));

  }

  worker(node, inputs) {
 }
}

class ErrorComponent extends Rete.Component {
  
  constructor() {
    super('Error');
    this.task = {
      outputs: {}
    }
  }

  builder(node) {
    var ctrl = new MessageControl(this.editor, node.data.msg);
    
    node
      .addControl(ctrl)
      .addInput(new Rete.Input('act', '', actionSocket,true));
  }

  worker(node, inputs) {
 }
}

var components = [new KeydownComponent, new EnterPressComponent, new OutputComponent, new ErrorComponent];
var container = document.querySelector('#rete')


var editor = new Rete.NodeEditor('tasksample@0.1.0', container,);
editor.use(AlightRenderPlugin);
editor.use(ConnectionPlugin);
editor.use(ContextMenuPlugin);
editor.use(TaskPlugin);

var engine = new Rete.Engine('tasksample@0.1.0');

components.map(c => {
  editor.register(c);
  engine.register(c);
});

editor.on('connectioncreate connectionremove nodecreate noderemove', ()=>{
  if(editor.silent) return;
     
  compile();
});




async function compile() {
    await engine.abort();
    await engine.process(editor.toJSON());
}



var data = {
    'id': 'tasksample@0.1.0',
    'nodes': {
        '2': {
            'id': 2,
            'data': {},
            'group': null,
            'inputs': {},
            'outputs': {
                'act': {
                    'connections': [
                        {
                            'node': 3,
                            'input': 'act'
                        }
                    ]
                },
                'key': {
                    'connections': [
                        {
                            'node': 3,
                            'input': 'key'
                        }
                    ]
                }
            },
            'position': [
                10,10
            ],
            'name': 'Input'
        },
        '3': {
            'id': 3,
            'data': {},
            'group': null,
            'inputs': {
                'act':{
                    'connections': [
                        {
                            'node': 2,
                            'output': 'act'
                        }
                    ]
                }, 
                'key': {
                    'connections': [
                        {
                            'node': 2,
                            'output': 'key'
                        }
                    ]
                }
            },
            'outputs': {
                'then':{
                    'connections': [
                        {
                            'node': 10,
                            'input': 'act'
                        }
                    ]
                }, 
                'else': {
                    'connections': [
                        {
                            'node': 11,
                            'input': 'act'
                        }
                    ]
                }
            },
            'position': [
                280,40
            ],
            'name': 'Algorithm Applied'
        },
        '10': {
            'id': 10,
            // 'data': {
            //     'msg': 'Enter!'
            // },
            'data':{},
            'group': null,
            'inputs': {
                'act': {
                    'connections': [
                        {
                            'node': 3,
                            'output': 'then'
                        }
                    ]
                }
            },
            'outputs': [],
            'position': [
                573, 10
            ],
            'name': 'Output'
        }
        ,
        '11': {

            'id': 11,
            // 'data': {
            //     'msg': 'Another key pressed'
            // }
            'data':{},
            'group': null,
            'inputs': {
                'act': {
                    'connections': [
                        {
                            'node': 3,
                            'output': 'else'
                        }
                    ]
                }
            },
            'outputs': [],
            'position': [
                600, 140
            ],
            'name': 'Error'
        }
    },
    'groups': {}
}

editor.fromJSON(data).then(() => {
    editor.view.resize();
    compile();
});