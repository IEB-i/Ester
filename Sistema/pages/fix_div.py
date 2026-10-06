import re

path = r'g:\Meu Drive\IEBI\Sistema\Ester\Sistema\pages\inscricoes.html'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target = r'''                  <i class="ph ph-share-network" style="font-size: 1.1rem;"></i> Transferir Alunos
              </button>
          </div>
          
          <!-- Formulário Adicionar -->'''

replacement = r'''                  <i class="ph ph-share-network" style="font-size: 1.1rem;"></i> Transferir Alunos
              </button>
              </div>
          </div>
          
          <!-- Formulário Adicionar -->'''

c2 = c.replace(target, replacement)
if c2 == c:
    print("NO MATCH")
else:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c2)
    print("REPLACED")
