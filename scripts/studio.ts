import { executeWorkflow } from './studio/workflow';

const clientInput = process.argv.slice(2).join(' ');

if (!clientInput) {
  console.error('Usage: npm run studio "client request"');
  process.exit(1);
}

executeWorkflow(clientInput).catch(error => {
  console.error('Studio workflow failed:', error.message);
  process.exit(1);
});
